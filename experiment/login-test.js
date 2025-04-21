
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 500,
  insecureSkipTLSVerify: true,
};

const users = Array.from({ length: 500 }, (_, i) => ({
  email: `user${i + 1}@test.com`,
  password: 'test',
}));

export default function () {
  const user = users[__ITER];
  const payload = JSON.stringify(user);

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post('https://frontend/api/users/login', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
