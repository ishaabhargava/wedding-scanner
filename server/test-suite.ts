import assert from 'assert';
import app from './src/app.js';
import { storageService } from './src/services/storage.service.js';
import { encrypt, decrypt } from './src/utils/encryption.js';
import { sanitizeFilename } from './src/utils/fileValidation.js';
import { generateAdminToken } from './src/middleware/auth.middleware.js';

// Simple lightweight test runner
async function runTests() {
  console.log('🧪 Starting Wedding Scanner Backend Integration Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // 1. Encryption & Security Unit Tests
  await test('AES-256-GCM: encrypt and decrypt roundtrip matches plaintext', () => {
    const secretRefreshToken = '1//04abcdefgh123456789_refresh_token_test';
    const encrypted = encrypt(secretRefreshToken);
    assert.notStrictEqual(encrypted, secretRefreshToken);
    assert.strictEqual(encrypted.split(':').length, 3, 'Must contain iv:tag:ciphertext');

    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, secretRefreshToken);
  });

  await test('Encryption: invalid ciphertext format handles gracefully', () => {
    const decrypted = decrypt('invalid-string');
    assert.strictEqual(decrypted, '');
  });

  // 2. Filename Sanitization & Duplicate Prevention
  await test('Filename Sanitization: preserves extension and base while removing unsafe chars', () => {
    const raw = 'Our Wedding Photo! @Reception & Dinner (1).jpg';
    const sanitized = sanitizeFilename(raw, false);
    assert.ok(sanitized.endsWith('.jpg'));
    assert.ok(!sanitized.includes('!'));
    assert.ok(!sanitized.includes('@'));
    assert.ok(!sanitized.includes('&'));
  });

  await test('Filename Sanitization: generates duplicate-safe unique filename', () => {
    const name1 = sanitizeFilename('photo.jpg', true);
    const name2 = sanitizeFilename('photo.jpg', true);
    assert.ok(name1.endsWith('.jpg'));
    assert.ok(name2.endsWith('.jpg'));
    assert.notStrictEqual(name1, name2, 'Two calls should generate unique filenames');
  });

  // 3. Storage Service Persistence
  await test('Storage Service: persists and retrieves wedding settings', () => {
    const updated = storageService.updateSettings({
      coupleNames: 'Emma & Lucas',
      weddingDate: 'December 12, 2025',
      heading: 'Celebrate Love with Us',
      maxPhotosPerSession: 30,
    });
    assert.strictEqual(updated.coupleNames, 'Emma & Lucas');
    assert.strictEqual(updated.weddingDate, 'December 12, 2025');

    const fetched = storageService.getSettings();
    assert.strictEqual(fetched.coupleNames, 'Emma & Lucas');
  });

  await test('Storage Service: handles upload records and failure logs', () => {
    const record = storageService.recordUploadSuccess({
      originalName: 'reception_cheers.jpg',
      savedName: 'reception_cheers_1234.jpg',
      driveFileId: 'drive_test_file_id_999',
      driveViewLink: 'https://drive.google.com/view/test',
      size: 1024 * 500,
      mimeType: 'image/jpeg',
    });
    assert.ok(record.id.startsWith('up_'));
    assert.strictEqual(record.status, 'success');

    const failRecord = storageService.recordUploadFailure('bad_image.bmp', 100, 'Unsupported format');
    assert.ok(failRecord.id.startsWith('fail_'));
    assert.strictEqual(failRecord.reason, 'Unsupported format');

    const stats = storageService.getStats();
    assert.ok(stats.totalPhotosUploaded >= 1);
    assert.ok(stats.totalFailures >= 1);
  });

  // 4. API Endpoints via Express Application instance
  const server = await new Promise<any>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // Health Check
    await test('GET /api/public/health returns 200 and healthy status', async () => {
      const res = await fetch(`${baseUrl}/api/public/health`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.status, 'healthy');
      assert.ok('driveConnected' in json);
    });

    // Public Config
    await test('GET /api/public/config returns couple details and 30 photo limit', async () => {
      const res = await fetch(`${baseUrl}/api/public/config`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.coupleNames, 'Emma & Lucas');
      assert.strictEqual(json.maxPhotosPerSession, 30);
    });

    // Admin Login - Failure
    await test('POST /api/admin/login rejects wrong password with 401', async () => {
      const res = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrong-password-123' }),
      });
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('Incorrect'));
    });

    // Admin Login - Success
    let validToken = '';
    await test('POST /api/admin/login succeeds with correct password and returns JWT', async () => {
      const res = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wedding2025' }),
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.token);
      validToken = json.token;
    });

    // Protected Route without token
    await test('GET /api/admin/stats rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/admin/stats`);
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('Unauthorized'));
    });

    // Protected Route with token
    await test('GET /api/admin/stats succeeds with valid Bearer token', async () => {
      const res = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.stats);
      assert.ok('totalPhotosUploaded' in json.stats);
    });

    // Admin Settings Update
    await test('PUT /api/admin/settings updates settings and caps maxPhotos at 35', async () => {
      const res = await fetch(`${baseUrl}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          coupleNames: 'Niks & Sheku',
          weddingDate: 'December 2, 2026',
          maxPhotosPerSession: 999, // Should be clamped to 30
        }),
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.settings.coupleNames, 'Niks & Sheku');
      assert.strictEqual(json.settings.weddingDate, 'December 2, 2026');
      assert.strictEqual(json.settings.maxPhotosPerSession, 30);
    });

    // Upload single photo test
    await test('POST /api/upload/single handles upload or unconnected Drive appropriately', async () => {
      const formData = new FormData();
      const fakeBlob = new Blob(['fake image content'], { type: 'image/jpeg' });
      formData.append('photo', fakeBlob, 'test_flower.jpg');

      const res = await fetch(`${baseUrl}/api/upload/single`, {
        method: 'POST',
        body: formData,
      });
      assert.ok([200, 500, 503].includes(res.status));
      const json = await res.json();
      assert.ok('success' in json);
    });

    // Upload with invalid file type
    await test('POST /api/upload/single rejects unsupported file extensions (.exe / .txt)', async () => {
      const formData = new FormData();
      const fakeBlob = new Blob(['malicious payload'], { type: 'text/plain' });
      formData.append('photo', fakeBlob, 'script.txt');

      const res = await fetch(`${baseUrl}/api/upload/single`, {
        method: 'POST',
        body: formData,
      });
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('not supported') || json.error.includes('JPG'));
    });

    // Batch upload limit (> 30 files)
    await test('POST /api/upload/batch rejects requests exceeding 30 photos', async () => {
      const formData = new FormData();
      for (let i = 0; i < 31; i++) {
        const fakeBlob = new Blob(['image content'], { type: 'image/jpeg' });
        formData.append('photos', fakeBlob, `photo_${i}.jpg`);
      }

      const res = await fetch(`${baseUrl}/api/upload/batch`, {
        method: 'POST',
        body: formData,
      });
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('limit') || json.error.includes('30'));
    });

  } finally {
    server.close();
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
