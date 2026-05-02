import { useEffect } from "react";

const GlobalStyles = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@600;700;800&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Cairo:wght@300;400;600;700&family=Tajawal:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      :root {
        --input-bg: rgba(255,255,255,0.03);
        --input-border: rgba(255,255,255,0.07);
        --input-color: #e2e8f0;
        --input-ph: #475569;
        --input-opt-bg: #0a1120;
        --ghost-border: rgba(255,255,255,0.07);
        --ghost-color: #94a3b8;
        --ghost-hover: #e2e8f0;
        --scrollbar: rgba(0,201,167,0.3);
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 4px; }

      @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
      @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
      @keyframes spin     { to { transform:rotate(360deg); } }
      @keyframes slideRight { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
      @keyframes modalIn  { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }

      .fade-up   { animation: fadeUp 0.45s cubic-bezier(.16,1,.3,1) both; }
      .fade-up-1 { animation: fadeUp 0.45s 0.05s cubic-bezier(.16,1,.3,1) both; }
      .fade-up-2 { animation: fadeUp 0.45s 0.10s cubic-bezier(.16,1,.3,1) both; }
      .fade-up-3 { animation: fadeUp 0.45s 0.15s cubic-bezier(.16,1,.3,1) both; }
      .fade-up-4 { animation: fadeUp 0.45s 0.20s cubic-bezier(.16,1,.3,1) both; }
      .modal-in  { animation: modalIn 0.3s cubic-bezier(.16,1,.3,1) both; }

      .hover-card { transition: all 0.2s ease; cursor: pointer; }
      .hover-card:hover { transform: translateY(-2px); }

      .nav-item { transition: all 0.18s ease; cursor: pointer; }
      .nav-item:hover { background: rgba(0,201,167,0.08) !important; }

      .status-dot { animation: pulse 2s infinite; }

      .btn-primary {
        background: linear-gradient(135deg, #00c9a7, #4a7bff);
        border: none; border-radius: 9px; padding: 9px 20px;
        color: #000; font-size: 13px; font-weight: 700;
        cursor: pointer; font-family: inherit;
        transition: opacity 0.15s;
      }
      .btn-primary:hover { opacity: 0.88; }

      .btn-ghost {
        background: transparent;
        border: 1px solid var(--ghost-border);
        border-radius: 9px; padding: 9px 16px;
        color: var(--ghost-color); font-size: 13px;
        cursor: pointer; font-family: inherit;
        transition: border-color 0.15s, color 0.15s;
      }
      .btn-ghost:hover { border-color: var(--ghost-hover); color: var(--ghost-hover); }

      .input-base {
        width: 100%;
        background: var(--input-bg);
        border: 1px solid var(--input-border);
        border-radius: 8px; padding: 9px 12px;
        color: var(--input-color); font-size: 13px; outline: none;
        font-family: inherit;
        transition: border-color 0.15s;
      }
      .input-base:focus { border-color: var(--input-opt-bg, rgba(0,201,167,0.45)); border-color: rgba(0,201,167,0.45); }
      .input-base::placeholder { color: var(--input-ph); }

      select.input-base option { background: var(--input-opt-bg); color: var(--input-color); }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export default GlobalStyles;
