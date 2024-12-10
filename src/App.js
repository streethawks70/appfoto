// src/App.js
// src/App.js
import React, { useState } from 'react';
import { init, send } from 'emailjs-com';
import Camera from './Camera';

// Inizializza EmailJS con la tua Public Key
init("0_vuI9zt_GvbEmGVp");

const App = () => {
  const [photo, setPhoto] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Funzione per ricevere la foto e la posizione dal componente Camera
  const handleCapture = (capturedPhoto, locationData) => {
    setPhoto(capturedPhoto);
    setUserLocation(locationData);
  };

  const handleSendEmail = async () => {
    try {
      if (!photo) {
        throw new Error("Nessuna foto da inviare.");
      }

      console.log("Base64 immagine originale:", photo);

      // Converte la foto da Base64 in un Blob
      const imageFile = base64ToBlob(photo);
      console.log("Blob generato dalla Base64:", imageFile);

      // Ridimensiona e comprime l'immagine
      const compressedBase64 = await compressImage(imageFile, 800, 800, 0.75);
      console.log("Base64 immagine compressa:", compressedBase64);

      // Prepara i parametri per l'email
      const templateParams = {
        to_email: 'alfonsofalcomata57@gmail.com',
        message: `Ecco la foto! Posizione: ${userLocation?.latitude || 'non disponibile'}, ${userLocation?.longitude || 'non disponibile'}`,
        image: `data:image/jpeg;base64,${compressedBase64}`,
      };

      // Invia l'email
      await send('service_w1or5ah', 'template_e2exsif', templateParams);
      console.log('Email inviata con successo!');
    } catch (error) {
      console.error('Errore nell\'invio dell\'email o nella compressione dell\'immagine:', error.message);

      // In caso di errore 413 (Payload Too Large), carica l'immagine su un servizio esterno
      if (error.message.includes("Payload Too Large")) {
        try {
          const cloudinaryUrl = await uploadToCloudinary(photo);
          console.log("Immagine caricata su Cloudinary:", cloudinaryUrl);

          const templateParams = {
            to_email: 'alfonsofalcomata57@gmail.com',
            message: `Ecco la foto! Posizione: ${userLocation?.latitude || 'non disponibile'}, ${userLocation?.longitude || 'non disponibile'}`,
            image_url: cloudinaryUrl, // Usa il link anziché il Base64
          };

          await send('service_w1or5ah', 'template_e2exsif', templateParams);
          console.log('Email inviata con successo utilizzando Cloudinary!');
        } catch (uploadError) {
          console.error('Errore nel caricamento su Cloudinary:', uploadError.message);
        }
      }
    }
  };

  // Funzione per convertire Base64 in Blob
  const base64ToBlob = (base64) => {
    const byteCharacters = atob(base64.split(',')[1]); // Decodifica la parte Base64
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: 'image/jpeg' });
  };

  // Funzione per ridimensionare e comprimere l'immagine
  const compressImage = (imageBlob, maxWidth, maxHeight, quality) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calcola le nuove dimensioni
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Disegna l'immagine ridimensionata
        ctx.drawImage(img, 0, 0, width, height);

        // Ottieni il Base64 compresso
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64.split(',')[1]); // Ritorna solo la parte Base64
      };

      img.onerror = () => reject(new Error("Errore nel caricamento dell'immagine."));
      reader.onerror = () => reject(new Error("Errore nella lettura del file."));
      reader.readAsDataURL(imageBlob);
    });
  };

  // Funzione per caricare l'immagine su Cloudinary
  const uploadToCloudinary = async (base64Image) => {
    const formData = new FormData();
    formData.append("file", base64Image);
    formData.append("upload_preset", "your_upload_preset"); // Inserisci il tuo preset

    const response = await fetch("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Errore durante il caricamento dell'immagine su Cloudinary");
    }

    const data = await response.json();
    return data.secure_url; // URL dell'immagine caricata
  };

  return (
    <div>
      <h1>App di Foto</h1>
      <Camera onCapture={handleCapture} />
      {photo && (
        <div>
          <h3>Anteprima Foto</h3>
          <img src={photo} alt="Foto catturata" />
          <button onClick={handleSendEmail}>Invia Foto via Email</button>
        </div>
      )}
    </div>
  );
};

export default App;
