// 全局配置文件

(function() {
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL =
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8787'
        : 'https://aia.lyuxueji.workers.dev';
  }
})();