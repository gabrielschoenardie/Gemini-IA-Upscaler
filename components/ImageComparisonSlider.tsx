import React, { useState, useRef, useCallback, MouseEvent, TouchEvent, useEffect } from 'react';
import { SliderHandleIcon, ZoomInIcon, ZoomOutIcon, ResetIcon } from './Icons';

interface ImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
}

const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startPanPos = useRef({ x: 0, y: 0 });

  const handleSliderMove = useCallback((clientX: number) => {
    if (!isSliderDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate slider position relative to the container's visual width
    // This needs to account for zoom if the slider is outside the zoom container,
    // but here the slider is inside.
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, [isSliderDragging]);

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!isPanning) return;
    const dx = clientX - startPanPos.current.x;
    const dy = clientY - startPanPos.current.y;
    
    setOffset(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    startPanPos.current = { x: clientX, y: clientY };
  }, [isPanning]);

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    
    // Check if clicking on slider handle or the vertical line
    if (target.closest('.slider-handle') || target.closest('.slider-line')) {
      setIsSliderDragging(true);
    } else if (scale > 1) {
      setIsPanning(true);
      startPanPos.current = { x: e.clientX, y: e.clientY };
    } else {
      // Default behavior if not zoomed: move slider to click location
      setIsSliderDragging(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        setSliderPosition((x / rect.width) * 100);
      }
    }
  };

  const handleMouseUp = () => {
    setIsSliderDragging(false);
    setIsPanning(false);
  };

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (isSliderDragging) {
      handleSliderMove(e.clientX);
    } else if (isPanning) {
      handlePanMove(e.clientX, e.clientY);
    }
  }, [isSliderDragging, isPanning, handleSliderMove, handlePanMove]);

  const handleTouchStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.slider-handle') || target.closest('.slider-line')) {
      setIsSliderDragging(true);
    } else if (scale > 1) {
      setIsPanning(true);
      startPanPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = useCallback((e: globalThis.TouchEvent) => {
    if (e.touches[0]) {
      if (isSliderDragging) {
        handleSliderMove(e.touches[0].clientX);
      } else if (isPanning) {
        handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  }, [isSliderDragging, isPanning, handleSliderMove, handlePanMove]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newScale = Math.min(Math.max(1, scale + delta), 5);
    setScale(newScale);
    if (newScale === 1) setOffset({ x: 0, y: 0 });
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const zoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1);
    setScale(newScale);
    if (newScale === 1) setOffset({ x: 0, y: 0 });
  };
  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('mouseleave', handleMouseUp);
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleMouseUp);
        container.addEventListener('touchcancel', handleMouseUp);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mouseleave', handleMouseUp);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleMouseUp);
        container.removeEventListener('touchcancel', handleMouseUp);
      }
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);


  return (
    <div className="relative w-full h-full group flex flex-col">
      {/* Zoom Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={zoomIn} 
          className="p-2 bg-gray-800/80 hover:bg-purple-600 rounded-full shadow-lg text-white transition-colors"
          title="Zoom In"
        >
          <ZoomInIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={zoomOut} 
          className="p-2 bg-gray-800/80 hover:bg-purple-600 rounded-full shadow-lg text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOutIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={resetZoom} 
          className="p-2 bg-gray-800/80 hover:bg-purple-600 rounded-full shadow-lg text-white transition-colors"
          title="Reset Zoom"
        >
          <ResetIcon className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex-grow w-full h-full overflow-hidden select-none cursor-crosshair bg-black rounded-lg"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
      >
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out"
          style={{ 
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transformOrigin: 'center'
          }}
        >
          {/* Before Image */}
          <img
            src={beforeImage}
            alt="Original"
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* After Image with Clipping */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={afterImage}
              alt="Upscaled"
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
          </div>

          {/* Slider Line */}
          <div
            className="slider-line absolute top-0 bottom-0 w-8 -ml-4 z-10 cursor-ew-resize flex justify-center pointer-events-auto"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* The visible thin white line */}
            <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center pointer-events-none">
              <div className="slider-handle bg-white rounded-full p-1 shadow-2xl transition-transform active:scale-95 pointer-events-auto">
                <SliderHandleIcon className="w-6 h-6 text-gray-800" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Visual Indicator of Zoom Level */}
      {scale > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-xs rounded-full pointer-events-none">
          {scale.toFixed(1)}x Zoom • Drag to Pan
        </div>
      )}
    </div>
  );
};

export default ImageComparisonSlider;