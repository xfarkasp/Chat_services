import http from 'k6/http';
import { sleep } from 'k6';
import { check } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
export let RequestDuration = new Trend('request_duration');
export let RequestSuccessRate = new Rate('request_success_rate');
export let RequestFailureRate = new Rate('request_failure_rate');
export let RequestCount = new Counter('request_count');
export let StatusCodeCounter = new Counter('status_code_counter');

export const options = {
  vus: 800,
  duration: '5m',
  insecureSkipTLSVerify: true,
  thresholds: {
    request_success_rate: ['rate>0.95'],
    request_duration: ['p(95)<500'],
  },
};

export default function () {
  const payload = JSON.stringify({                                                                                                                                                                                                                                                                                                                                                                  
       sender_id: 6,                                                                                                                                      
       content: 'Group-test-message',                                                                                                                                                                                                                                               
       group_members: [ 7, 6, 5, 1010 ]                                                                                                                       
     });

  const params = {
    headers: { "Content-Type": "application/json" },
  };

  const res = http.post('https://frontend/api/groups/2/messages', payload, params);

  // Metrics tracking
  RequestCount.add(1);
  RequestDuration.add(res.timings.duration);
  RequestSuccessRate.add(res.status >= 200 && res.status < 300);
  RequestFailureRate.add(res.status >= 400);
  StatusCodeCounter.add(1, { status: res.status });

  // Optional: Log errors (limited to sampling to avoid spam)
  if (res.status >= 400 && Math.random() < 0.01) {
    console.error(`Error ${res.status}: ${res.body}`);
  }

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  sleep(1);
}
