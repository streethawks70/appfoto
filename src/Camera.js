import React, { useRef, useEffect, useState } from 'react';

const Camera = ({ onCapture }) => {
  const videoRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      if (isCameraActive) return; // Evita di avviare la fotocamera se è già attiva

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      } catch (err) {
        console.error("Errore nell'accesso alla fotocamera: ", err);
      }
    };

    startCamera();
    getLocation(); // Ottieni la posizione all'avvio

    // Copia videoRef.current in una variabile locale per la cleanup
    const currentVideoRef = videoRef.current;

    return () => {
      // Ferma il video e libera le risorse quando il componente viene smontato
      if (currentVideoRef) {
        const stream = currentVideoRef.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        }
        currentVideoRef.srcObject = null;
      }
    };
  }, [isCameraActive]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }, (error) => {
        console.error("Errore nella geolocalizzazione: ", error);
      });
    } else {
      console.error("Geolocalizzazione non supportata.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      console.error("Il video non è disponibile o non ha dimensioni valide.");
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/png');
    setPhoto(imageData);
    onCapture(imageData, location); // Passa anche la posizione al componente genitore
  };

  return (
    <div>
      <video 
        ref={videoRef} 
        autoPlay 
        style={{ width: '100%', height: 'auto' }} 
        onLoadedMetadata={() => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error("Errore nella riproduzione del video: ", err);
            });
          }
        }}
      ></video>
      <button onClick={capturePhoto}>Scatta Foto</button>
      {photo && (
        <div>
          <h3>Anteprima Foto:</h3>
          <img src={photo} alt="Captured" />
          {location && (
            <p>Posizione: {location.latitude}, {location.longitude}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Camera;
