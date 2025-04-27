import http from 'k6/http';
import { sleep } from 'k6';
import { check } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import encoding from 'k6/encoding';

// Load the file as base64
const fileData = open('/home/samurai/Downloads/65535c0459f914d06ddeef7a_Kubernetes-Everything-You-Need-to-Know-2048x1159.png', 'b'); // 'b' for binary

// Custom metrics
export let RequestDuration = new Trend('request_duration');
export let RequestSuccessRate = new Rate('request_success_rate');
export let RequestFailureRate = new Rate('request_failure_rate');
export let RequestCount = new Counter('request_count');
export let StatusCodeCounter = new Counter('status_code_counter');

export const options = {
    vus: 100,
    duration: '5m',
    insecureSkipTLSVerify: true,
    thresholds: {
      request_success_rate: ['rate>0.95'],
      request_duration: ['p(95)<500'],
    },
  };

export default function () {
  const formData = {
    sender_id: '9',
    receiver_id: '7',
    content: '',
    file: http.file(fileData, '65535c0459f914d06ddeef7a_Kubernetes-Everything-You-Need-to-Know-2048x1159.png', 'image/png'),
  };

  const res = http.post('https://frontend/api/chat/send-message', formData);

  // Track metrics
  RequestCount.add(1);
  RequestDuration.add(res.timings.duration);
  RequestSuccessRate.add(res.status >= 200 && res.status < 300);
  RequestFailureRate.add(res.status >= 400);
  StatusCodeCounter.add(1, { status: res.status });

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  sleep(1);
}
