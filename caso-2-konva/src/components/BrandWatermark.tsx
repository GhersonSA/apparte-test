function BrandWatermark() {
  return (
    <div className="brand-watermark" aria-label="Redes de GhersonSA">
      <div className="brand-watermark__links">
        <a
          href="https://www.linkedin.com/in/gherson-sa/"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          className="brand-watermark__icon-link"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="brand-watermark__icon">
            <path
              fill="currentColor"
              d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zm7 0h3.8v1.7h.1c.5-.9 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z"
            />
          </svg>
        </a>

        <a
          href="https://github.com/GhersonSA"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="brand-watermark__icon-link"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="brand-watermark__icon">
            <path
              fill="currentColor"
              d="M12 .5A11.5 11.5 0 0 0 .5 12.2c0 5.2 3.3 9.6 7.9 11.2.6.1.8-.3.8-.6v-2.2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.4 3.6 1.1.1-.8.4-1.4.8-1.7-2.6-.3-5.3-1.4-5.3-6a4.8 4.8 0 0 1 1.2-3.3c-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.3a11 11 0 0 1 6 0c2.3-1.6 3.3-1.3 3.3-1.3.6 1.6.2 2.8.1 3.1a4.8 4.8 0 0 1 1.2 3.3c0 4.6-2.7 5.7-5.3 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6a11.7 11.7 0 0 0 7.9-11.2A11.5 11.5 0 0 0 12 .5z"
            />
          </svg>
        </a>
      </div>

      <p className="brand-watermark__text">
        <a href="https://www.ghersonsa.com/" target="_blank" rel="noreferrer">
          © Powered by GhersonSA. 2026.
        </a>
      </p>
    </div>
  );
}

export default BrandWatermark;
