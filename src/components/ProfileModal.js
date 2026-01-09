import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import './ProfileModal.css';

const ProfileModal = ({ onClose }) => {
  const { user, checkAuthStatus } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const cropContainerRef = useRef(null);
  const imageRef = useRef(null);

  // Sync preview when user data changes
  useEffect(() => {
    if (user?.avatarUrl) {
      setPreviewUrl(user.avatarUrl);
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Compress image function
  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };


  // Start camera
  const startCamera = async () => {
    try {
      setMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setMessage('Unable to access camera. Please check permissions or use "Choose File" instead.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/png');
      setImageToCrop(imageData);
      stopCamera();
      setShowCrop(true);
    }
  };

  // Handle file selection
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImageToCrop(e.target.result);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Initialize crop area
  useEffect(() => {
    if (showCrop && imageToCrop && cropContainerRef.current && imageRef.current) {
      const img = imageRef.current;
      const container = cropContainerRef.current;
      
      img.onload = () => {
        const containerRect = container.getBoundingClientRect();
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = containerRect.width / containerRect.height;
        
        let displayWidth, displayHeight;
        if (imgAspect > containerAspect) {
          displayWidth = containerRect.width;
          displayHeight = containerRect.width / imgAspect;
        } else {
          displayHeight = containerRect.height;
          displayWidth = containerRect.height * imgAspect;
        }
        
        const size = Math.min(displayWidth, displayHeight);
        const x = (displayWidth - size) / 2;
        const y = (displayHeight - size) / 2;
        
        setCropArea({ x, y, width: size, height: size });
      };
    }
  }, [showCrop, imageToCrop]);

  // Handle crop area dragging
  const handleCropMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y });
  };

  const handleCropMouseMove = (e) => {
    if (!isDragging || !cropContainerRef.current) return;
    
    const container = cropContainerRef.current;
    const rect = container.getBoundingClientRect();
    const img = imageRef.current;
    
    if (!img) return;
    
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = rect.width / rect.height;
    
    let displayWidth, displayHeight;
    if (imgAspect > containerAspect) {
      displayWidth = rect.width;
      displayHeight = rect.width / imgAspect;
    } else {
      displayHeight = rect.height;
      displayWidth = rect.height * imgAspect;
    }
    
    const size = cropArea.width;
    const maxX = displayWidth - size;
    const maxY = displayHeight - size;
    
    let newX = e.clientX - rect.left - dragStart.x;
    let newY = e.clientY - rect.top - dragStart.y;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    setCropArea(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
  };

  // Handle crop resize
  const handleCropResize = (e, corner) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startCrop = { ...cropArea };
    
    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      if (corner === 'se') {
        const newSize = Math.max(100, startCrop.width + deltaX);
        setCropArea({ ...startCrop, width: newSize, height: newSize });
      } else if (corner === 'nw') {
        const newSize = Math.max(100, startCrop.width - deltaX);
        const delta = newSize - startCrop.width;
        setCropArea({ 
          x: startCrop.x + delta, 
          y: startCrop.y + delta, 
          width: newSize, 
          height: newSize 
        });
      }
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Apply crop and compress
  const applyCrop = async () => {
    if (!imageToCrop || !cropCanvasRef.current || !imageRef.current || !cropContainerRef.current) return;
    
    const img = imageRef.current;
    const canvas = cropCanvasRef.current;
    const container = cropContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate scale factor
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = rect.width / rect.height;
    
    let displayWidth, displayHeight;
    if (imgAspect > containerAspect) {
      displayWidth = rect.width;
      displayHeight = rect.width / imgAspect;
    } else {
      displayHeight = rect.height;
      displayWidth = rect.height * imgAspect;
    }
    
    const scaleX = img.naturalWidth / displayWidth;
    const scaleY = img.naturalHeight / displayHeight;
    
    // Calculate crop coordinates in original image
    const cropX = cropArea.x * scaleX;
    const cropY = cropArea.y * scaleY;
    const cropWidth = cropArea.width * scaleX;
    const cropHeight = cropArea.height * scaleY;
    
    // Set canvas size and draw cropped image
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, 400, 400);
    
    // Compress and set as avatar
    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
    setAvatarUrl(compressedBase64);
    setPreviewUrl(compressedBase64);
    setShowCrop(false);
    setImageToCrop(null);
    setMessage('');
  };

  const cancelCrop = () => {
    setShowCrop(false);
    setImageToCrop(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      const response = await authAPI.updateMe({ name, avatarUrl });
      const data = await response.json();
      if (response.ok) {
        setMessage('Profile updated!');
        await checkAuthStatus();
        setTimeout(onClose, 800);
      } else {
        setMessage(data.message || 'Failed to update');
      }
    } catch (e) {
      setMessage('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <motion.div
        className="profile-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Camera View */}
        <AnimatePresence>
          {showCamera && (
            <motion.div
              className="camera-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="camera-header">
                <h3>Take Photo</h3>
                <button className="close-btn" onClick={stopCamera}>×</button>
              </div>
              <div className="camera-preview">
                <video ref={videoRef} autoPlay playsInline />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
              <div className="camera-actions">
                <button className="btn-secondary" onClick={stopCamera}>Cancel</button>
                <button className="btn-primary capture-btn" onClick={capturePhoto}>
                  📷 Capture
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crop View */}
        <AnimatePresence>
          {showCrop && (
            <motion.div
              className="crop-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
            >
              <div className="crop-header">
                <h3>Crop Image</h3>
                <button className="close-btn" onClick={cancelCrop}>×</button>
              </div>
              <div className="crop-container" ref={cropContainerRef}>
                <img ref={imageRef} src={imageToCrop} alt="Crop" />
                <div
                  className="crop-overlay"
                  style={{
                    left: `${cropArea.x}px`,
                    top: `${cropArea.y}px`,
                    width: `${cropArea.width}px`,
                    height: `${cropArea.height}px`,
                  }}
                  onMouseDown={handleCropMouseDown}
                >
                  <div className="crop-handle crop-handle-nw" onMouseDown={(e) => handleCropResize(e, 'nw')}></div>
                  <div className="crop-handle crop-handle-se" onMouseDown={(e) => handleCropResize(e, 'se')}></div>
                </div>
                <canvas ref={cropCanvasRef} style={{ display: 'none' }} />
              </div>
              <div className="crop-actions">
                <button className="btn-secondary" onClick={cancelCrop}>Cancel</button>
                <button className="btn-primary" onClick={applyCrop}>Apply Crop</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Profile Edit View */}
        {!showCamera && !showCrop && (
          <>
            <div className="profile-header">
              <h3>Edit Profile</h3>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="profile-body">
              <div className="preview">
                <div className="avatar large">
                  {previewUrl ? (
                    <img src={previewUrl} alt={name} onError={() => setPreviewUrl('')} />
                  ) : (
                    <span>{name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>

              <div className="form-group">
                <label>Profile Picture</label>
                <div className="avatar-upload-buttons">
                  <button type="button" className="upload-btn camera-btn" onClick={startCamera}>
                    <span className="btn-icon">📷</span>
                    <span>Take Photo</span>
                  </button>
                  <button type="button" className="upload-btn file-btn" onClick={handleFileButtonClick}>
                    <span className="btn-icon">📁</span>
                    <span>Choose File</span>
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                <small>Take a photo with your camera or choose from your device. You can crop the image to fit perfectly.</small>
              </div>

              {message && (
                <div className={`message ${message.includes('updated') || message.includes('Processing') ? 'message-success' : 'message-error'}`}>
                  {message}
                </div>
              )}
            </div>

            <div className="profile-actions">
              <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ProfileModal;
