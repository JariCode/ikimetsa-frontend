import React from 'react';

export default function SiteFooter() {
  return (
    <div className="site-footer">
      © {new Date().getFullYear()}{' '}
      <a href="https://jaricode.fi/" target="_blank" rel="noopener noreferrer">
        jaricode.fi
      </a>
    </div>
  );
}