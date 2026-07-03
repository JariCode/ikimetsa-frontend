import React, { useEffect, useRef } from 'react';

export default function GameLogComponent({ logs }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="unified-log-box">
      <div className="unified-log-header">Tapahtumaloki</div>
      <div className="unified-log-content">
        {logs.length === 0 ? (
          <p className="story-text-small">Polku katkeaa edessäsi risteyskohtaan. Puista kuuluu outoa korahtelua...</p>
        ) : (
          logs.map((log, index) => (
            <p key={index} className={`unified-log-line type-${log.type || 'general'}`}>
              {/* Aikaleiman span-rivi poistettu tästä kokonaan tilan säästämiseksi ja rivityksen korjaamiseksi */}
              {log.message}
            </p>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}