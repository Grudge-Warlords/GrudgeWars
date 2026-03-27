/**
 * ChannelSidebar
 *
 * 56px Discord-style channel sidebar with:
 *  - Icon + 3-char stacked label
 *  - # prefix for text channels, ♫ for voice
 *  - Orange left-border on active channel
 *  - Small red unread dot when channel has unread messages
 *  - Marquee full-name label above the message area (rendered outside this component)
 *
 * Usage:
 *   <ChannelSidebar
 *     activeId="gen"
 *     unread={{ ann: true, trd: true }}
 *     onSelect={(channel) => setActive(channel.id)}
 *   />
 */

import { useState, useEffect, useRef } from 'react';

// ── Channel definitions ───────────────────────────────────────────────────────

const TEXT_CHANNELS = [
  { id: 'nod', label: 'nod', fullName: '# nodes',         desc: 'Node network updates & block data'   },
  { id: 'gen', label: 'gen', fullName: '# general',        desc: 'General chat'                        },
  { id: 'ann', label: 'ann', fullName: '# announcements',  desc: 'Official Grudge Studio announcements'},
  { id: 'trd', label: 'trd', fullName: '# trading',        desc: 'GBUX & item trading'                 },
  { id: 'rul', label: 'rul', fullName: '# rules',          desc: 'Community rules'                     },
  { id: 'sts', label: 'sts', fullName: '# status',         desc: 'Service & server status'             },
];

const VOICE_CHANNELS = [
  { id: 'lby', label: 'lby', fullName: '♫ Lobby',   desc: 'General voice lobby'   },
  { id: 'war', label: 'war', fullName: '♫ Warlords', desc: 'Game coordination voice'},
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function HashIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
      <path d="M5 2L4 14M12 2L11 14M2 6h12M2 10h12"
        stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function VoiceIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
      <path d="M8 2a3 3 0 0 1 3 3v3a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"
        stroke={color} strokeWidth="1.4"/>
      <path d="M3 8a5 5 0 0 0 10 0M8 13v2"
        stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

// ── Marquee label (auto-scroll when text overflows) ───────────────────────────

export function ChannelMarquee({ channel }) {
  if (!channel) return null;
  const name = channel.fullName || channel.label;
  return (
    <div style={{
      overflow: 'hidden', whiteSpace: 'nowrap',
      fontSize: 11, letterSpacing: '0.06em',
      color: 'rgba(255,255,255,0.55)',
      fontFamily: 'monospace',
    }}>
      <span style={{
        display: 'inline-block',
        animation: name.length > 14 ? 'channelMarquee 6s linear infinite' : 'none',
      }}>
        {name}
      </span>
      <style>{`
        @keyframes channelMarquee {
          0%   { transform: translateX(0); }
          30%  { transform: translateX(0); }
          70%  { transform: translateX(-60%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ── Channel button ────────────────────────────────────────────────────────────

function ChannelBtn({ ch, isActive, hasUnread, isVoice, onClick }) {
  const [hovered, setHovered] = useState(false);

  const bg = isActive
    ? 'rgba(219,99,49,0.18)'
    : hovered
      ? 'rgba(255,255,255,0.06)'
      : 'transparent';

  return (
    <button
      title={ch.desc}
      onClick={() => onClick(ch)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        height: 48,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        background: bg,
        border: 'none',
        borderLeft: isActive ? '3px solid #DB6331' : '3px solid transparent',
        cursor: 'pointer',
        padding: 0,
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* Unread dot */}
      {hasUnread && !isActive && (
        <span style={{
          position: 'absolute',
          top: 6,
          right: 8,
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#ef4444',
          border: '1.5px solid #0d0f1c',
        }} />
      )}

      {/* Icon */}
      <span style={{ color: isActive ? '#FAAC47' : hovered ? '#e2d5c0' : 'rgba(255,255,255,0.38)' }}>
        {isVoice
          ? <VoiceIcon size={14} color="currentColor" />
          : <HashIcon  size={14} color="currentColor" />
        }
      </span>

      {/* 3-char label */}
      <span style={{
        fontSize: 9,
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
        color: isActive ? '#FAAC47' : hovered ? '#e2d5c0' : 'rgba(255,255,255,0.35)',
        lineHeight: 1,
        textTransform: 'lowercase',
      }}>
        {ch.label}
      </span>
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider({ label }) {
  return (
    <div style={{
      padding: '8px 4px 2px',
      textAlign: 'center',
      fontSize: 7,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.2)',
      fontFamily: 'monospace',
    }}>
      {label}
    </div>
  );
}

// ── Main ChannelSidebar ───────────────────────────────────────────────────────

export default function ChannelSidebar({
  activeId = 'gen',
  unread   = {},           // { channelId: true } — channels with unread messages
  onSelect = () => {},
}) {
  // Allow parent to start with full channel object
  const allChannels = [...TEXT_CHANNELS, ...VOICE_CHANNELS];
  const [activeChannel, setActiveChannel] = useState(
    () => allChannels.find(c => c.id === activeId) || TEXT_CHANNELS[1]
  );

  useEffect(() => {
    const ch = allChannels.find(c => c.id === activeId);
    if (ch) setActiveChannel(ch);
  }, [activeId]);

  function handleSelect(ch) {
    setActiveChannel(ch);
    onSelect(ch);
  }

  return (
    <div style={{
      width: 56,
      flexShrink: 0,
      background: 'linear-gradient(180deg, #0d0f1c 0%, #0a0c18 100%)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      <Divider label="txt" />

      {TEXT_CHANNELS.map(ch => (
        <ChannelBtn
          key={ch.id}
          ch={ch}
          isActive={activeChannel?.id === ch.id}
          hasUnread={!!unread[ch.id]}
          isVoice={false}
          onClick={handleSelect}
        />
      ))}

      <Divider label="vc" />

      {VOICE_CHANNELS.map(ch => (
        <ChannelBtn
          key={ch.id}
          ch={ch}
          isActive={activeChannel?.id === ch.id}
          hasUnread={!!unread[ch.id]}
          isVoice={true}
          onClick={handleSelect}
        />
      ))}
    </div>
  );
}

// Re-export channel data so parent can build a message pane
export { TEXT_CHANNELS, VOICE_CHANNELS };
