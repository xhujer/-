let body = JSON.parse($response.body || "{}");

if (body && body.data && Array.isArray(body.data.config_list) && body.data.config_list.length > 0) {
  body.data.config_list = [];
  if (typeof body.data.ttl === "number") {
    body.data.ttl = 60;
  }
}

$done({ body: JSON.stringify(body) });