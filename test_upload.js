import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch'; // if node 18+, native fetch is available. I will use native fetch.
import crypto from 'crypto';

(async () => {
  try {
    // 1. Create a dummy user directly in DB to get a JWT, or just auth with the endpoint
    // To simplify, let's just sign up a temporary admin
    const uniqueId = Date.now();
    const signupRes = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `admin-${uniqueId}@test.com`, password: 'password', name: 'Admin' })
    });
    const signupData = await signupRes.json();
    const token = signupData.token;
    
    // 2. Create a dummy list
    const listRes = await fetch('http://localhost:3000/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'Test List' })
    });
    const listData = await listRes.json();
    const listId = listData.id;

    // 3. Perform the bulk upload
    const formData = new FormData();
    formData.append('list_id', listId);
    formData.append('file', fs.createReadStream('./test.csv'));

    console.log('Sending upload...');
    const uploadRes = await fetch('http://localhost:3000/api/contacts/bulk', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const body = await uploadRes.text();
    console.log('HTTP Status:', uploadRes.status);
    console.log('Response:', body);
  } catch (e) {
    console.error(e);
  }
})();
