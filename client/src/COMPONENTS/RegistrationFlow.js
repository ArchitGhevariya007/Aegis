import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line
import { authAPI, storage } from "../services/api";
import NavBar from "./NavBar";
import { Upload } from 'lucide-react';
/**
 * Digital ID System – Registration Flow (5 steps)
 * Clean UI, strong UX; demo-complete
 */

// Utility: simple classnames merger
function cx(...args) {
  return args.filter(Boolean).join(" ");
}

const STEPS = [
  { id: 1, label: "Basic Details" },
  { id: 2, label: "Password Setup" },
  { id: 3, label: "Document Upload & OCR" },
  { id: 4, label: "Facial Capture & Liveness" },
  { id: 5, label: "Face Matching Confirmation" },
];

// Residency list (sample)
const RESIDENCIES = [
  "United States",
  "Canada",
  "Japan",
  "Australia",
  "Bangkok",
];

export default function RegistrationFlow() {
  const navigate = useNavigate();
  
  // Schema-aligned state
  const [user, setUser] = useState({
    email: "",
    password: "", 
    confirmPassword: "",
    birthDate: "",
    residency: "",
    phoneNumber: null, // Changed to null for proper handling
    kycStatus: "pending",
    documents: [],
    faceData: {
      idFaceImage: "",
      liveFaceImage: "",
      faceEncoding: "",
      livenessVerified: false,
      faceMatched: false,
    },
  });

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'success', 'error', 'camera_error'
  const [modalMessage, setModalMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Document upload handling (Step 2)
  const [docPreviewName, setDocPreviewName] = useState("");
  const [docBase64, setDocBase64] = useState("");
  const [ocrEditable, setOcrEditable] = useState({
    documentType: "", // Always empty for user input
    name: "",
    dob: "",
    idNumber: "",
    address: "",
  });

  // Camera refs (Step 3)
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [usingCamera, setUsingCamera] = useState(false);

  // Derived: step title subtitle
  const stepTitle = useMemo(() => "Registration Process", []);
  const stepSubtitle = useMemo(
    () => "Complete your digital identity verification",
    []
  );

  // Page-level scroll (hidden scrollbar handled via CSS class)
  // No body locking here to allow natural page scrolling

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!user.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!user.birthDate) {
      newErrors.birthDate = "Date of birth is required";
    } else {
      const age = new Date().getFullYear() - new Date(user.birthDate).getFullYear();
      if (age < 18) {
        newErrors.birthDate = "You must be at least 18 years old";
      }
    }
    
    if (!user.residency) {
      newErrors.residency = "Please select your residency";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!user.password) {
      newErrors.password = "Password is required";
    } else if (user.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(user.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }
    
    if (!user.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (user.password !== user.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation
  const canNextFromStep1 = useMemo(() => {
    if (!user.email) return false;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user.email)) return false;
    if (!user.birthDate) return false;
    if (!user.residency) return false;
    return true;
  }, [user]);

  const canNextFromStep2 = useMemo(() => {
    if (!user.password) return false;
    if (user.password.length < 6) return false;
    if (user.password !== user.confirmPassword) return false;
    return true;
  }, [user]);

  const canNextFromStep3 = useMemo(() => {
    return !!docBase64 && 
           !!ocrEditable.documentType.trim() && 
           !!ocrEditable.name.trim() && 
           !!ocrEditable.dob.trim() && 
           !!ocrEditable.idNumber.trim() && 
           !!ocrEditable.address.trim();
  }, [docBase64, ocrEditable]);
  const canNextFromStep4 = useMemo(
    () => (!!user.faceData.liveFaceImage || !usingCamera) && !processing, // allow demo skip but block during processing
    [user.faceData.liveFaceImage, usingCamera, processing]
  );

  // Navigation
  const goNext = () => setStep((s) => Math.min(5, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  // Camera controls
  const startCamera = async () => {
    try {
      // Reset states
      setUsingCamera(false);
      setCameraReady(false);
      
      // Request high-quality video with fallback options
      const constraints = {
        video: {
          facingMode: "user",
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 30, max: 60 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      };

      console.log('Requesting camera with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      
      console.log('Camera settings:', {
        width: settings.width,
        height: settings.height,
        frameRate: settings.frameRate,
        deviceId: settings.deviceId
      });

      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      // Set up video element
      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true; // Ensure muted
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        let timeout;
        
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('error', handleError);
          clearTimeout(timeout);
        };
        
        const handleLoadedMetadata = async () => {
          try {
            await video.play();
            // Wait for a few frames to ensure stable video
            await new Promise(resolve => setTimeout(resolve, 100));
            cleanup();
            resolve();
          } catch (error) {
            cleanup();
            reject(error);
          }
        };
        
        const handleError = (error) => {
          cleanup();
          reject(error);
        };
        
        timeout = setTimeout(() => {
          cleanup();
          reject(new Error('Video initialization timeout'));
        }, 10000); // 10 second timeout
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('error', handleError);
      });

      // Verify video dimensions
      if (!video.videoWidth || !video.videoHeight) {
        throw new Error('Video dimensions not available');
      }

      console.log('Video ready:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        playing: !video.paused
      });

      setUsingCamera(true);
      
      // Wait additional time for stream to stabilize before allowing capture
      console.log('Waiting for video stream to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second stabilization
      
      // Final check
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        console.log('Camera fully ready for capture');
        setCameraReady(true);
      } else {
        throw new Error('Camera not fully initialized');
      }
      
    } catch (e) {
      console.error("Camera error:", e);
      setUsingCamera(false);
      setCameraReady(false);
      setModalType('camera_error');
      setModalMessage(
        e.name === 'NotAllowedError' ? 
          "Camera access denied. Please allow camera access and try again." :
          e.name === 'NotFoundError' ?
          "No camera found. Please ensure your camera is connected and try again." :
          e.name === 'NotReadableError' ?
          "Camera is in use by another application. Please close other apps using the camera and try again." :
          e.message || "Unable to access camera. Please check your camera settings and try again."
      );
      setShowModal(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setUsingCamera(false);
    setCameraReady(false);
  };

  const captureSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setModalType('error');
      setModalMessage('Camera not ready. Please wait a moment and try again.');
      setShowModal(true);
      return;
    }
    
    // Don't allow capture if camera isn't ready
    if (!cameraReady) {
      setModalType('error');
      setModalMessage('Camera is still initializing. Please wait a few seconds and try again.');
      setShowModal(true);
      return;
    }
    
    // Show processing indicator
    setProcessing(true);
    setProcessingMessage("Processing face capture...");
    
    try {
      const v = videoRef.current;
      
      console.log('Starting capture, video state:', {
        videoWidth: v.videoWidth,
        videoHeight: v.videoHeight,
        readyState: v.readyState,
        paused: v.paused,
        ended: v.ended,
        srcObject: !!v.srcObject,
        cameraReady: cameraReady
      });
      
      // Comprehensive video readiness check
      if (!v.srcObject) {
        // Camera stream was lost, need to restart
        setCameraReady(false);
        setUsingCamera(false);
        throw new Error('Camera stream was lost. Please click "Start Camera" again.');
      }
      
      if (!v.videoWidth || !v.videoHeight) {
        throw new Error('Video dimensions not available. Please ensure your camera is working and try again.');
      }
      
      if (v.readyState < 2) {
        throw new Error('Video is not loaded. Please wait a few more seconds and try again.');
      }

      // Check if video is actually playing
      if (v.paused || v.ended) {
        console.log('Video not playing, attempting to restart...');
        try {
          await v.play();
          // Wait for video to actually start playing
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          // Verify it's actually playing
          if (v.paused || v.ended) {
            throw new Error('Failed to start video playback');
          }
        } catch (playError) {
          console.error('Failed to restart video:', playError);
          // Reset camera state
          setCameraReady(false);
          setUsingCamera(false);
          throw new Error('Camera stopped working. Please click "Start Camera" again.');
        }
      }
      
      // Wait for multiple frames to ensure fresh capture
      console.log('Waiting for fresh frames...');
      for (let i = 0; i < 3; i++) {
        await new Promise(requestAnimationFrame);
      }
      
      const c = canvasRef.current;
      
      // Set canvas size to match video
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      
      const ctx = c.getContext("2d", { alpha: false }); // Disable alpha for better performance
      
      // Clear canvas and set white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, c.width, c.height);
      
      // Draw mirrored video frame with image processing
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(v, -c.width, 0, c.width, c.height);
      ctx.restore();

      // Don't apply image processing - it can affect face detection quality
      // Just use the raw captured frame
      
      // Convert to high-quality JPEG
      const jpegData = c.toDataURL("image/jpeg", 0.95);
      
      console.log('Captured frame dimensions:', {
        videoWidth: v.videoWidth,
        videoHeight: v.videoHeight,
        canvasWidth: c.width,
        canvasHeight: c.height,
        dataLength: jpegData.length
      });
      
      // Validate image data
      if (jpegData.length < 1000) {
        throw new Error('Invalid capture data. Please try again.');
      }
      
      try {
        // Attempt face detection and cropping
        const croppedFace = await detectAndCropFace(jpegData, false); // false for live capture
        
        // Validate cropped face
        if (!croppedFace || croppedFace.length < 1000) {
          throw new Error('Invalid face crop result. Please try again.');
        }
        
      setUser((u) => ({
        ...u,
        faceData: { ...u.faceData, liveFaceImage: croppedFace, livenessVerified: true },
      }));
        
        // Don't show modal for successful capture, just proceed
        console.log('Face captured successfully!');
        
      } catch (faceError) {
        console.error('Face detection error:', faceError);
        setModalType('error');
        setModalMessage(
          faceError.message === 'No faces detected in image' ?
          'No face detected. Please ensure your face is clearly visible and well-lit.' :
          faceError.message === 'Multiple faces detected' ?
          'Multiple faces detected. Please ensure only your face is in the frame.' :
          faceError.message || 'Failed to detect face. Please try again.'
        );
        setShowModal(true);
        throw faceError; // Re-throw to prevent proceeding
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      setModalType('error');
      setModalMessage(error.message || 'Failed to capture face. Please try again.');
      setShowModal(true);
    } finally {
      setProcessing(false);
      setProcessingMessage('');
    }
  };

  // Face match verification (Step 5)
  useEffect(() => {
    if (step === 5) {
      const hasBoth = user.faceData.liveFaceImage && user.faceData.idFaceImage;
      if (hasBoth) {
        // Show processing for face matching
        setProcessing(true);
        setProcessingMessage("Verifying face match...");
        
        // Simulate face matching delay
        setTimeout(() => {
          setUser((u) => ({
            ...u,
            kycStatus: "face_matched",
            faceData: { ...u.faceData, faceMatched: true },
          }));
          setProcessing(false);
          setProcessingMessage('');
        }, 2000); // 2 second delay for realistic processing
      }
    }
  }, [step, user.faceData.idFaceImage, user.faceData.liveFaceImage]);

  // Face detection using server-side SCRFD
  async function detectAndCropFace(base64, isDocumentPhoto = false) {
    try {
      console.log('Sending face detection request...', { isDocumentPhoto });
      
      // Ensure image is properly formatted
      let imageData = base64;
      if (!base64.startsWith('data:')) {
        imageData = `data:image/jpeg;base64,${base64}`;
      }
      
      // Log image dimensions before sending
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });
      console.log('Original image dimensions:', {
        width: img.width,
        height: img.height,
        aspectRatio: (img.width / img.height).toFixed(2)
      });

      // Calculate optimal parameters based on image size
      const minDimension = Math.min(img.width, img.height);
      const maxDimension = Math.max(img.width, img.height);
      const aspectRatio = maxDimension / minDimension;

      console.log('Face detection parameters:', {
        minDimension,
        maxDimension,
        aspectRatio,
        isDocumentPhoto
      });

      const response = await fetch('http://localhost:5000/api/ai/detect-faces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });
      
      const result = await response.json();
      
      // Log all detected faces for debugging
      if (result.faces && result.faces.length > 0) {
        console.log('Detected faces:', result.faces.map((face, idx) => ({
          index: idx,
          confidence: face.confidence,
          size: face.size || 'unknown',
          position: face.position || 'unknown'
        })));
      }
      
      console.log('Face detection response:', {
        success: result.success,
        faceCount: result.faces?.length || 0,
        hasCroppedFace: !!result.croppedFace,
        croppedFaceLength: result.croppedFace?.length || 0,
        isDocumentPhoto,
        selectedFaceIndex: result.selectedFaceIndex || 0
      });
      
      if (!result.success) {
        throw new Error(result.message || 'Face detection failed');
      }
      
      if (result.faces.length === 0) {
        throw new Error('No faces detected. Please ensure your face is clearly visible and well-lit.');
      }
      
      // For live capture with multiple faces, provide helpful error
      if (!isDocumentPhoto && result.faces.length > 1) {
        console.warn('Multiple faces detected:', result.faces.length);
        console.warn('This might be due to reflections, shadows, or patterns in the background.');
        console.warn('Using the most confident/largest face...');
        
        // Don't throw error, just use the best face (server should handle selection)
        // throw new Error('Multiple faces detected. Please ensure only your face is in the image.');
      }
      
      // For document photo, use the largest face if multiple detected
      if (isDocumentPhoto && result.faces.length > 1) {
        console.log(`Multiple faces detected in document (${result.faces.length}), server selected the best one`);
      }
      
      if (!result.croppedFace) {
        throw new Error('Face cropping failed. Please try again with a clearer photo.');
      }
      
      // Verify cropped image dimensions
      const croppedImg = new Image();
      await new Promise((resolve, reject) => {
        croppedImg.onload = resolve;
        croppedImg.onerror = reject;
        croppedImg.src = result.croppedFace;
      });
      console.log('Cropped face dimensions:', {
        width: croppedImg.width,
        height: croppedImg.height,
        aspectRatio: (croppedImg.width / croppedImg.height).toFixed(2),
        isDocumentPhoto
      });

      return result.croppedFace;
    } catch (error) {
      console.error('Face detection error:', error);
      throw error; // Don't fallback to original image, show error instead
    }
  }

  // Handle doc upload -> preview + OCR + face detection
  const handleDocChange = async (file) => {
    if (!file) return;
    setDocPreviewName(file.name);
    setProcessing(true);
    setProcessingMessage("Processing document and extracting information...");
    
    console.log('Starting document upload:', {
      fileName: file.name,
      size: file.size,
      type: file.type
    });
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      console.log('Document loaded as base64:', {
        fileName: file.name,
        base64Length: base64.length,
        startsWithData: base64.startsWith('data:'),
        mimeType: base64.split(';')[0].split(':')[1] || 'unknown'
      });
      
      // Ensure proper data URL format
      if (!base64.startsWith('data:')) {
        const mimeType = file.type || 'image/jpeg';
        const formattedBase64 = `data:${mimeType};base64,${base64}`;
        setDocBase64(formattedBase64);
      } else {
      setDocBase64(base64);
      }
      
      try {
        
        // Process OCR extraction
        console.log('Sending document for OCR processing...');
        const ocrResponse = await fetch('http://localhost:5000/api/ocr/extract-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: base64, 
            documentType: 'id_card' 
          })
        });
        
        const ocrResult = await ocrResponse.json();
        console.log('OCR processing result:', ocrResult);
        
        // Extract face from document but keep full image
        const croppedFace = await detectAndCropFace(base64, true); // true for document photo
        
        // Initialize empty form data
        let extractedData = {
          documentType: "", // Always empty for user input
          name: "",
          dob: "",
          idNumber: "",
          address: "",
        };

        if (ocrResult.success && ocrResult.data && ocrResult.data.documentData) {
          const ocrData = ocrResult.data.documentData;
          extractedData = {
            documentType: "", // Always empty for user input
            name: ocrData.name || "",
            dob: ocrData.dob || "", // Already in DD-MM-YYYY format from backend
            idNumber: ocrData.idNumber || "",
            address: ocrData.address || "",
          };
          
          // Log only detected fields
          const detectedFields = [];
          if (ocrData.name) detectedFields.push(`Name: ${ocrData.name}`);
          if (ocrData.dob) detectedFields.push(`DOB: ${ocrData.dob}`);
          if (ocrData.idNumber) detectedFields.push(`ID: ${ocrData.idNumber}`);
          if (ocrData.address) detectedFields.push(`Address: ${ocrData.address}`);
          
          console.log('✅ OCR detected fields:', detectedFields.length > 0 ? detectedFields : 'None');
          console.log('📊 OCR confidence:', ((ocrResult.data?.confidence || ocrResult.confidence || 0) * 100).toFixed(1) + '%');
        } else {
          console.log('❌ OCR failed or no text detected, fields left empty');
        }
        
        setUser((u) => ({
          ...u,
          documents: [
            {
              type: "id_document",
              fileName: file.name,
              ocrData: extractedData,
            },
          ],
          fullDocumentImage: base64, // Store full document image separately
          faceData: { ...u.faceData, idFaceImage: croppedFace }, // Keep cropped face for verification
        }));

        // Fill OCR editable fields with extracted data
        setOcrEditable(extractedData);
        
      } catch (error) {
        console.error('❌ Document processing failed:', error);
        // Set empty data on error but still store full image
        const croppedFace = await detectAndCropFace(base64);
        setUser((u) => ({
          ...u,
          documents: [
            {
              type: "id_document",
              fileName: file.name,
            ocrData: {
                documentType: "",
              name: "",
              dob: "",
                idNumber: "",
                address: ""
            },
            },
          ],
          fullDocumentImage: base64, // Store full document image separately
          faceData: { ...u.faceData, idFaceImage: croppedFace }, // Keep cropped face for verification
        }));

        setOcrEditable({
          name: "",
          dob: "",
          documentType: "",
          address: "",
        });
      } finally {
        setProcessing(false);
        setProcessingMessage('');
      }
    };
    // Read file as data URL with proper MIME type
    reader.readAsDataURL(new Blob([file], { type: file.type || 'image/jpeg' }));
  };

  const formatForInputDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${dt.getFullYear()}-${m}-${day}`;
  };

  // Final submit payload aligned with schema
  // removed unused helper to silence warnings

  const handleComplete = async () => {
    setSubmitting(true);
    setError(''); // Clear any previous errors
    try {
      // Clean up data before sending
      const cleanedOcrData = {
        documentType: ocrEditable.documentType || null,
        name: ocrEditable.name || null,
        dob: ocrEditable.dob || null,
        idNumber: ocrEditable.idNumber || null,
        address: ocrEditable.address || null
      };

      const documentData = {
        type: "id_document",
        fileName: "id_document.jpg",
        ocrData: cleanedOcrData
      };

      // Ensure we have the full document image
      console.log('Checking document image:', {
        docBase64Present: !!docBase64,
        docBase64Length: docBase64?.length || 0,
        docBase64Type: docBase64?.split(';')[0].split(':')[1] || 'unknown',
        docBase64StartsWithData: docBase64?.startsWith('data:') || false
      });

      if (!docBase64) {
        setError("Document image is required. Please upload your ID document.");
        setModalType('error');
        setModalMessage("Document image is required. Please upload your ID document.");
        setShowModal(true);
        setSubmitting(false);
        return;
      }

      // Ensure document image is in correct format
      if (!docBase64.startsWith('data:')) {
        setError("Invalid document image format. Please try uploading again.");
        setModalType('error');
        setModalMessage("Invalid document image format. Please try uploading again.");
        setShowModal(true);
        setSubmitting(false);
        return;
      }
      
      // Clear any previous errors
      setError('');

      console.log('Registration data:', {
        email: user.email,
        phoneNumber: user.phoneNumber || 'Not provided',
        birthDate: user.birthDate,
        residency: user.residency,
        hasIdImage: !!user.faceData.idFaceImage,
        hasLiveImage: !!user.faceData.liveFaceImage,
        idImageLength: user.faceData.idFaceImage?.length || 0,
        liveImageLength: user.faceData.liveFaceImage?.length || 0,
        ocrData: cleanedOcrData,
        documentData: documentData,
        hasFullDocument: !!docBase64,
        fullDocumentLength: docBase64?.length || 0,
        fullDocumentType: docBase64?.split(';')[0].split(':')[1] || 'unknown'
      });

      // Call the registration API with face images, full document image, and OCR data
      const response = await authAPI.register({
        email: user.email,
        password: user.password,
        birthDate: user.birthDate,
        residency: user.residency,
        phoneNumber: user.phoneNumber || null,
        idFaceImage: user.faceData.idFaceImage, // Cropped face for verification
        liveFaceImage: user.faceData.liveFaceImage,
        fullDocumentImage: docBase64, // Use docBase64 directly for full document image
        ocrData: cleanedOcrData, // Include cleaned OCR data
        documentData: documentData // Include cleaned document information
      });

      if (response.success) {
        // Update local state
        setUser((u) => ({ ...u, kycStatus: "completed" }));
        
        // Show success modal
        setModalType('success');
        setModalMessage("Registration successful! You can now login.");
        setShowModal(true);
      } else {
        setModalType('error');
        setModalMessage("Registration failed: " + response.message);
        setShowModal(true);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setModalType('error');
      setModalMessage("Registration failed: " + err.message);
      setError("Registration failed: " + err.message);
      setShowModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 animate-fade-in no-scrollbar" style={{ height: '100vh', overflowY: 'auto' }}>
      <NavBar />

      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-10 animate-fade-up">
        <h1 className="text-3xl md:text-4xl font-semibold text-center">
          {stepTitle}
        </h1>
        <p className="text-center text-slate-500 mt-2">{stepSubtitle}</p>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-6 mt-6">
          {STEPS.map((s) => {
            const active = s.id === step;
            const done = s.id < step;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div
                  className={cx(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm", 
                    done && "bg-emerald-500 text-white",
                    active && !done && "bg-indigo-600 text-white",
                    !active && !done && "bg-slate-200 text-slate-600"
                  )}
                >
                  {s.id}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 animate-fade-up w-full max-w-md mx-auto">
          <div key={step} className="animate-fade-up">
          {step === 1 && (
             <Step1Basic
               user={user}
               setUser={setUser}
               canNext={canNextFromStep1}
               errors={errors}
               setErrors={setErrors}
               onNext={() => {
                 if (validateStep1()) {
                   setUser((u) => ({ ...u, kycStatus: "pending" }));
                   goNext();
                 }
               }}
             />
           )}

          {step === 2 && (
            <Step2Password
              user={user}
              setUser={setUser}
              onBack={goBack}
              errors={errors}
              setErrors={setErrors}
              onNext={() => {
                if (validateStep2()) {
                  setUser((u) => ({ ...u, kycStatus: "password_set" }));
                  goNext();
                }
              }}
              canNext={canNextFromStep2}
            />
          )}

          {step === 3 && (
            <Step3Document
              docPreviewName={docPreviewName}
              setDocPreviewName={setDocPreviewName}
              docBase64={docBase64}
              onFileChange={handleDocChange}
              ocrEditable={ocrEditable}
              setOcrEditable={setOcrEditable}
              onBack={goBack}
              onNext={() => {
                setUser((u) => ({ ...u, kycStatus: "document_uploaded" }));
                goNext();
              }}
              canNext={canNextFromStep3}
            />
          )}

          {step === 4 && (
            <Step4Liveness
              onBack={goBack}
              onNext={() => {
                setUser((u) => ({ ...u, kycStatus: "liveness_verified" }));
                stopCamera();
                goNext();
              }}
              startCamera={startCamera}
              captureSnapshot={captureSnapshot}
              cameraReady={cameraReady}
              usingCamera={usingCamera}
              videoRef={videoRef}
              canvasRef={canvasRef}
              canNext={canNextFromStep4}
              processing={processing}
              processingMessage={processingMessage}
            />
          )}

          {step === 5 && (
            <Step5Confirmation
              user={user}
              onBack={goBack}
              onComplete={handleComplete}
              submitting={submitting}
              processing={processing}
              processingMessage={processingMessage}
              error={error}
            />
          )}
          </div>
        </div>
      </div>

      {/* Processing Modal */}
      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Processing</h3>
              </div>
              <p className="text-slate-600 text-center">{processingMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={cx(
                  "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                  modalType === 'success' ? "bg-green-100" : "bg-red-100"
                )}>
                  {modalType === 'success' ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {modalType === 'success' ? 'Success' : 
                   modalType === 'camera_error' ? 'Camera Error' : 'Error'}
                </h3>
              </div>
              <p className="text-slate-600 mb-6">{modalMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    // Only redirect to login after final registration success
                    if (modalType === 'success' && step === 5) {
                      navigate('/login');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Step components ---

function Step1Basic({ user, setUser, onNext, canNext, errors, setErrors }) {
  const [dobInput, setDobInput] = useState("");

  useEffect(() => {
    if (user.birthDate) {
      const d = new Date(user.birthDate);
      if (!isNaN(d)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setDobInput(`${dd}-${mm}-${yyyy}`);
      }
    }
  }, [user.birthDate]);

  const handleDobChange = (val) => {
    // Keep as dd-mm-yyyy
    const cleaned = val.replace(/[^0-9-]/g, "").slice(0, 10);
    let next = cleaned;
    if (cleaned.length === 2 || cleaned.length === 5) {
      if (!cleaned.endsWith("-")) next = cleaned + "-";
    }
    setDobInput(next);

    const parts = next.split("-");
    if (parts.length === 3 && parts[2]?.length === 4) {
      const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
      if (dd && mm && yyyy) {
        const iso = new Date(yyyy, mm - 1, dd).toISOString();
        setUser((u) => ({ ...u, birthDate: iso }));
      }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Basic Details</h2>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-slate-600">Email Address</label>
          <input
            type="email"
            value={user.email}
            onChange={(e) => {
              const newEmail = e.target.value;
              setUser((u) => ({ ...u, email: newEmail }));
              
              // Real-time validation
              const newErrors = { ...errors };
              if (!newEmail) {
                newErrors.email = "Email is required";
              } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
                newErrors.email = "Please enter a valid email address";
              } else {
                delete newErrors.email;
              }
              setErrors(newErrors);
            }}
            placeholder="Email Address"
            className={cx(
              "mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
              errors.email ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
            )}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="text-sm text-slate-600">Date of Birth</label>
          <input
            type="text"
            inputMode="numeric"
            value={dobInput}
            onChange={(e) => {
              const newDob = e.target.value;
              handleDobChange(newDob);
              
              // Real-time validation
              const newErrors = { ...errors };
              if (!newDob) {
                newErrors.birthDate = "Date of birth is required";
              } else {
                const parts = newDob.split("-");
                if (parts.length === 3 && parts[2]?.length === 4) {
                  const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
                  if (dd && mm && yyyy) {
                    const age = new Date().getFullYear() - yyyy;
                    if (age < 18) {
                      newErrors.birthDate = "You must be at least 18 years old";
                    } else {
                      delete newErrors.birthDate;
                    }
                  } else {
                    newErrors.birthDate = "Please enter a valid date";
                  }
                }
              }
              setErrors(newErrors);
            }}
            placeholder="dd-mm-yyyy"
            className={cx(
              "mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
              errors.birthDate ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
            )}
          />
          {errors.birthDate && (
            <p className="mt-1 text-xs text-red-500">{errors.birthDate}</p>
          )}
        </div>
        <div>
          <label className="text-sm text-slate-600">Phone Number</label>
          <input
            type="tel"
            value={user.phoneNumber || ''}
            onChange={(e) => {
              const newPhone = e.target.value.trim();
              setUser((u) => ({ ...u, phoneNumber: newPhone || null }));
              
              // Real-time validation
              const newErrors = { ...errors };
              if (newPhone && !/^\+?[\d\s-]{8,}$/.test(newPhone)) {
                newErrors.phoneNumber = "Please enter a valid phone number";
              } else {
                delete newErrors.phoneNumber;
              }
              setErrors(newErrors);
            }}
            placeholder="+61 234 567 890"
            className={cx(
              "mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
              errors.phoneNumber ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
            )}
          />
          {errors.phoneNumber ? (
            <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Optional - Enter phone number with country code</p>
          )}
        </div>
        <div>
          <label className="text-sm text-slate-600">Select Residency</label>
          <div className="relative mt-2">
            <select
              className={cx(
                "w-full appearance-none rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
                errors.residency ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
              )}
              value={user.residency}
              onChange={(e) => {
                const newResidency = e.target.value;
                setUser((u) => ({ ...u, residency: newResidency }));
                
                // Real-time validation
                const newErrors = { ...errors };
                if (!newResidency) {
                  newErrors.residency = "Please select your residency";
                } else {
                  delete newErrors.residency;
                }
                setErrors(newErrors);
              }}
            >
              <option value="" disabled>
                Select Residency
              </option>
              {RESIDENCIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
          </div>
          {errors.residency && (
            <p className="mt-1 text-xs text-red-500">{errors.residency}</p>
          )}
        </div>


      </div>

      <div className="mt-6">
        <button
          onClick={onNext}
          disabled={!canNext}
          className={cx(
            "w-full rounded-xl px-4 py-3 text-white",
            canNext ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Step2Password({ user, setUser, onBack, onNext, canNext, errors, setErrors }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Password Setup</h2>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-slate-600">Password</label>
          <input
            type="password"
            value={user.password}
            onChange={(e) => {
              const newPassword = e.target.value;
              setUser((u) => ({ ...u, password: newPassword }));
              
              // Real-time validation
              const newErrors = { ...errors };
              if (!newPassword) {
                newErrors.password = "Password is required";
              } else if (newPassword.length < 6) {
                newErrors.password = "Password must be at least 6 characters long";
              } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(newPassword)) {
                newErrors.password = "Password must contain at least one uppercase letter, lowercase letter, number, and special character";
              } else {
                delete newErrors.password;
              }
              setErrors(newErrors);
            }}
            placeholder="Enter your password"
            className={cx(
              "mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
              errors.password ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
            )}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Password must be at least 6 characters long with uppercase, lowercase, and number</p>
          )}
        </div>

        <div>
          <label className="text-sm text-slate-600">Confirm Password</label>
          <input
            type="password"
            value={user.confirmPassword}
            onChange={(e) => {
              const newConfirmPassword = e.target.value;
              setUser((u) => ({ ...u, confirmPassword: newConfirmPassword }));
              
              // Real-time validation
              const newErrors = { ...errors };
              if (!newConfirmPassword) {
                newErrors.confirmPassword = "Please confirm your password";
              } else if (newConfirmPassword !== user.password) {
                newErrors.confirmPassword = "Passwords do not match";
              } else {
                delete newErrors.confirmPassword;
              }
              setErrors(newErrors);
            }}
            placeholder="Confirm your password"
            className={cx(
              "mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
              errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
            )}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border px-4 py-3 text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className={cx(
            "flex-1 rounded-xl px-4 py-3 text-white", 
            canNext ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Step3Document({
  docPreviewName,
  setDocPreviewName,
  docBase64,
  onFileChange,
  ocrEditable,
  setOcrEditable,
  onBack,
  onNext,
  canNext,
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Document Upload & OCR</h2>

      <div className="mt-6 border-2 border-dashed rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Upload className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-slate-600">Upload your ID card or driver's license</p>
        <div className="mt-4">
          <label className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 cursor-pointer bg-white hover:bg-slate-50">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => onFileChange(e.target.files?.[0])}
              className="hidden"
            />
            <span>Choose File</span>
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="text-sm text-slate-600">Document Preview</label>
          <div className="mt-2 flex items-center gap-3 rounded-xl border px-4 py-3">
            <span className="text-slate-400">📎</span>
            <span className="text-sm text-slate-700">
              {docPreviewName || "No file selected"}
            </span>
          </div>
        </div>

        <div className="grid gap-3">
          <label className="text-sm font-medium text-slate-700">
            Extracted Information (Editable) <span className="text-red-500">*</span>
          </label>
          
          {/* Document Type Dropdown */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Document Type *</label>
            <select
              className="rounded-xl border px-4 py-3 w-full bg-white"
              value={ocrEditable.documentType}
              onChange={(e) => setOcrEditable((o) => ({ ...o, documentType: e.target.value }))}
              required
            >
              <option value="">Select Document Type</option>
              <option value="Passport">Passport</option>
              <option value="National ID">National ID</option>
              <option value="Driver's License">Driver's License</option>
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="PAN Card">PAN Card</option>
              <option value="Voter ID">Voter ID</option>
            </select>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Full Name *</label>
            <input
              className="rounded-xl border px-4 py-3 w-full"
              placeholder="Full Name"
              value={ocrEditable.name}
              onChange={(e) => setOcrEditable((o) => ({ ...o, name: e.target.value }))}
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Date of Birth (DD-MM-YYYY) *</label>
            <input
              type="text"
              className="rounded-xl border px-4 py-3 w-full"
              placeholder="DD-MM-YYYY"
              value={ocrEditable.dob}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                let formatted = '';
                if (val.length > 0) formatted = val.substring(0, 2);
                if (val.length > 2) formatted += '-' + val.substring(2, 4);
                if (val.length > 4) formatted += '-' + val.substring(4, 8);
                setOcrEditable((o) => ({ ...o, dob: formatted }));
              }}
              maxLength="10"
              required
            />
          </div>

          {/* ID Number */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">ID Number *</label>
            <input
              className="rounded-xl border px-4 py-3 w-full"
              placeholder="ID Number (PAN, Aadhaar, etc.)"
              value={ocrEditable.idNumber || ''}
              onChange={(e) => setOcrEditable((o) => ({ ...o, idNumber: e.target.value }))}
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Address *</label>
            <textarea
              className="rounded-xl border px-4 py-3 w-full resize-none"
              placeholder="Complete Address"
              rows={3}
              value={ocrEditable.address}
              onChange={(e) => setOcrEditable((o) => ({ ...o, address: e.target.value }))}
              required
            />
          </div>

          {/* Disclaimer Message */}
          <div className=" p-2 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-xs text-amber-800">
                <p className="mt-1">
                  *Extracted information may be inaccurate due to OCR limitations. 
                  Please double-check all fields carefully before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-xl border px-4 py-3 hover:bg-slate-50">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className={cx(
            "flex-1 rounded-xl px-4 py-3 text-white", 
            canNext ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Step4Liveness({
  onBack,
  onNext,
  startCamera,
  captureSnapshot,
  cameraReady,
  usingCamera,
  videoRef,
  canvasRef,
  canNext,
  processing,
  processingMessage,
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Facial Capture & Liveness Check</h2>

      <div className="mt-6 rounded-2xl bg-slate-100 text-slate-800 p-6 border">
        <div className="mx-auto max-w-xl rounded-xl bg-white p-4 border">
          <div className="flex items-center justify-center mb-3 text-2xl">📷</div>
          <p className="text-center text-sm text-slate-600 mb-3">
            Position your face in the camera
          </p>
          <div className="rounded-lg border border-slate-300 h-64 flex items-center justify-center overflow-hidden bg-slate-50 relative">
            <video ref={videoRef} className="h-full" />
            <canvas ref={canvasRef} className="hidden" />
            {!usingCamera && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-slate-400">Camera View</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Indicator */}
      {processing && (
        <div className="mt-6 rounded-2xl border p-4 bg-blue-50">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700 font-medium">{processingMessage}</span>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={onBack} className="flex-1 min-w-[140px] rounded-xl border px-4 py-3 hover:bg-slate-50">
          Back
        </button>
        {!usingCamera ? (
          <button onClick={startCamera} className="flex-1 min-w-[140px] rounded-xl border px-4 py-3 hover:bg-slate-50">
            Start Camera
          </button>
        ) : (
          <button 
            onClick={captureSnapshot} 
            disabled={!cameraReady || processing} 
            className={cx(
              "flex-1 min-w-[140px] rounded-xl border px-4 py-3 transition-all",
              cameraReady && !processing 
                ? "hover:bg-slate-50 border-indigo-600 text-indigo-600" 
                : "opacity-50 cursor-not-allowed border-slate-300 text-slate-400"
            )}
            title={!cameraReady ? "Please wait for camera to initialize..." : "Capture your face"}
          >
            {processing ? "Processing..." : cameraReady ? "Capture" : "Initializing..."}
          </button>
        )}
        <button onClick={onNext} disabled={!canNext} className={cx(
          "flex-1 min-w-[140px] rounded-xl px-4 py-3 text-white", 
          canNext ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed"
        )}>
          {"Next"}
        </button>
      </div>
    </div>
  );
}

function Step5Confirmation({ user, onBack, onComplete, submitting, processing, processingMessage, error }) {
  const success = user.faceData.faceMatched;

  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Face Matching Confirmation</h2>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-4">
          <p className="text-sm text-slate-600 mb-2">ID Photo</p>
          <div className="aspect-[4/3] rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
            {user.faceData.idFaceImage ? (
              <img src={user.faceData.idFaceImage} alt="ID" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <div className="text-slate-400 text-3xl">📷 ID Document Photo</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-sm text-slate-600 mb-2">Live Capture</p>
          <div className="aspect-[4/3] rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
            {user.faceData.liveFaceImage ? (
              <img src={user.faceData.liveFaceImage} alt="Live" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <div className="text-slate-400 text-3xl">📷 Your Live Photo</div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Indicator */}
      {processing && (
        <div className="mt-6 rounded-2xl border p-6 bg-blue-50">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700 font-medium">{processingMessage}</span>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border p-6 text-center">
        <p className={cx("text-lg font-medium", 
          processing ? "text-blue-600" : 
          success ? "text-emerald-600" : "text-amber-600"
        )}> 
          {processing ? "Verifying Face Match..." : 
           success ? "Face Match Successful" : "Awaiting Face Match"}
        </p>
        <p className="text-slate-600 mt-1">
          {processing ? "Please wait while we verify your identity" :
           success
            ? "Your identity has been verified successfully"
            : "Ensure both photos are provided to verify your identity"}
        </p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="w-24 rounded-xl border px-4 py-3 hover:bg-slate-50">
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={!success || submitting || processing}
          className={cx(
            "flex-1 rounded-xl px-4 py-3 text-white",
            success && !submitting && !processing
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-indigo-300 cursor-not-allowed"
          )}
        >
          {processing ? "Verifying..." : submitting ? "Registering..." : "Register"}
        </button>
      </div>
    </div>
  );
}
