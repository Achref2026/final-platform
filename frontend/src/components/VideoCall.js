import React, { useEffect, useState, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';

const VideoCall = ({ roomUrl, onLeave, userName }) => {
  const callFrameRef = useRef(null);
  const [callFrame, setCallFrame] = useState(null);
  const [participants, setParticipants] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomUrl) return;

    const initializeCall = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create the call frame
        const frame = DailyIframe.createFrame(callFrameRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '8px',
          },
          showLeaveButton: true,
          showFullscreenButton: true,
        });

        setCallFrame(frame);

        // Add event listeners
        frame
          .on('loaded', () => {
            console.log('Daily iframe loaded');
          })
          .on('joined-meeting', (event) => {
            console.log('Joined meeting', event);
            setIsLoading(false);
          })
          .on('participant-joined', (event) => {
            console.log('Participant joined', event.participant);
            setParticipants(prev => ({
              ...prev,
              [event.participant.session_id]: event.participant
            }));
          })
          .on('participant-updated', (event) => {
            console.log('Participant updated', event.participant);
            setParticipants(prev => ({
              ...prev,
              [event.participant.session_id]: event.participant
            }));
          })
          .on('participant-left', (event) => {
            console.log('Participant left', event.participant);
            setParticipants(prev => {
              const updated = { ...prev };
              delete updated[event.participant.session_id];
              return updated;
            });
          })
          .on('left-meeting', () => {
            console.log('Left meeting');
            setIsLoading(false);
            if (onLeave) onLeave();
          })
          .on('error', (event) => {
            console.error('Daily error', event);
            setError('Failed to connect to video call');
            setIsLoading(false);
          });

        // Join the room
        await frame.join({
          url: roomUrl,
          userName: userName || 'Student',
        });

      } catch (err) {
        console.error('Error initializing call:', err);
        setError('Failed to initialize video call');
        setIsLoading(false);
      }
    };

    initializeCall();

    // Cleanup
    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
    };
  }, [roomUrl, userName, onLeave]);

  const leaveCall = () => {
    if (callFrame) {
      callFrame.leave();
    }
  };

  if (error) {
    return (
      <div className="video-call-container bg-gray-100 rounded-lg p-8 text-center">
        <div className="text-red-600 text-6xl mb-4">❌</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onLeave}
          className="btn-secondary"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="video-call-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to video call...</p>
          </div>
        </div>
      )}
      
      <div className="video-controls mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-bold text-gray-900">📹 Theory Course Session</h3>
          <span className="text-sm text-gray-600">
            {Object.keys(participants).length} participant(s)
          </span>
        </div>
        
        <button
          onClick={leaveCall}
          className="btn-danger flex items-center space-x-2"
        >
          <span>📞</span>
          <span>Leave Call</span>
        </button>
      </div>

      <div
        ref={callFrameRef}
        className="video-frame"
        style={{ height: '500px', width: '100%' }}
      />
    </div>
  );
};

export default VideoCall;
