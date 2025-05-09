import http from "k6/http";
import { sleep } from "k6";
import { check } from "k6";

export const options = {
  vus: 1000,
  duration: "5m",
  insecureSkipTLSVerify: true,
  thresholds: {
    request_success_rate: ["rate>0.95"],
    request_duration: ["p(95)<500"],
  },
};

export default function () {
  const payload = JSON.stringify({
    sender_id: "5",
    receiver_id: "6",
    content: `Test message`,
  });

  const params = {
    headers: { "Content-Type": "application/json" },
  };

  const res = http.post(
    "https://frontend/api/chat/send-message",
    payload,
    params
  );

  // Optional: Log errors (limited to sampling to avoid spam)
  if (res.status >= 400 && Math.random() < 0.01) {
    console.error(`Error ${res.status}: ${res.body}`);
  }

  check(res, {
    "status is 2xx": (r) => r.status >= 200 && r.status < 300,
  });

  sleep(1);
}
