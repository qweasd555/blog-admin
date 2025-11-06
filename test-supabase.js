import('node-fetch').then(fetch => {
  const url = 'https://qghxnulnxxtvaqupoxeo.supabase.co/rest/v1/posts?select=id&limit=1';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHhudWxueHh0dmFxdXBveGVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTAzNzAzMCwiZXhwIjoyMDc2NjEzMDMwfQ.sPtCIEOcftn-B9Z_vbAHsZ5VfxhD2yXShZzf3uf7toM';
  
  fetch(url, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);
    return response.text();
  })
  .then(text => {
    console.log('响应内容:', text);
  })
  .catch(error => {
    console.error('请求失败:', error);
  });
}).catch(err => {
  console.error('导入失败:', err);
});