import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { generateImageFromText, generateImageFromImage, generateImageFromTwoImages } from './services/geminiService';
import { FeatureKey, Language, FeatureConfig, SavedImage, StyleKey, StyleOption, AspectRatio } from './types';
import { UI_TEXT, FEATURES_CONFIG, LOCALIZED_FEATURES, LOCALIZED_STYLES } from './constants';
import { LoadingSpinner, UploadIcon, ImageIcon, LibraryIcon, SaveIcon, TrashIcon, CloseIcon, ImportIcon, ExportIcon, MicrophoneIcon, DownloadIcon } from './components/icons';

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string, dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: file.type, dataUrl });
    };
    reader.onerror = (error) => reject(error);
  });
};

// Web Speech API interface
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onresult: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<FeatureKey>(FeatureKey.TEXT_TO_PHOTO);
  const [prompt, setPrompt] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>(StyleKey.NONE);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [inputImage, setInputImage] = useState<{ base64: string; mimeType: string, dataUrl: string } | null>(null);
  const [inputImage2, setInputImage2] = useState<{ base64: string; mimeType: string, dataUrl: string } | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<SavedImage[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false);

  const T = UI_TEXT[language];
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const promptRef = useRef<string>('');
  
  const features = useMemo<FeatureConfig[]>(() => {
    return (Object.keys(FeatureKey) as Array<keyof typeof FeatureKey>).map(key => {
      const featureKey = FeatureKey[key];
      return {
        key: featureKey,
        ...FEATURES_CONFIG[featureKey],
        ...LOCALIZED_FEATURES[language][featureKey],
      };
    });
  }, [language]);

  const styles = useMemo<StyleOption[]>(() => {
    return (Object.keys(StyleKey) as Array<keyof typeof StyleKey>).map(key => {
        const styleKey = StyleKey[key];
        return {
            key: styleKey,
            ...LOCALIZED_STYLES[language][styleKey],
        };
    });
  }, [language]);

  const activeFeature = features.find(f => f.key === activeTab)!;
  
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'vi' ? 'vi-VN' : 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setPrompt(promptRef.current + transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone access was denied. Please allow microphone access in your browser settings to use this feature.");
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;

      return () => {
        recognition.stop();
      };
    } else {
      setIsSpeechSupported(false);
      console.warn("Speech recognition not supported by this browser.");
    }
  }, [language]);

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      promptRef.current = prompt ? prompt + ' ' : '';
      if(promptRef.current) setPrompt(promptRef.current);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai-photo-studio-library');
      if (saved) {
        setLibrary(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load library from localStorage", e);
      setLibrary([]);
    }
  }, []);
  
  const updateLibrary = (newLibrary: SavedImage[]) => {
      setLibrary(newLibrary);
      localStorage.setItem('ai-photo-studio-library', JSON.stringify(newLibrary));
  };

  useEffect(() => {
    // Reset inputs when tab changes
    setPrompt('');
    setInputImage(null);
    setInputImage2(null);
    setOutputImage(null);
    setError(null);
  }, [activeTab]);

  const handleImageUpload = useCallback(async (file: File | null, imageSlot: 1 | 2) => {
    if (!file) return;
    setError(null);
    try {
      const imageData = await fileToBase64(file);
      if (imageSlot === 1) {
        setInputImage(imageData);
      } else {
        setInputImage2(imageData);
      }
    } catch (err) {
      setError(T.errorTitle);
      console.error(err);
    }
  }, [T.errorTitle]);
  
  const handleSaveToLibrary = () => {
    if (!outputImage || !prompt) return;
    const mimeType = outputImage.substring(outputImage.indexOf(":") + 1, outputImage.indexOf(";"));
    const newImage: SavedImage = {
      id: `${Date.now()}-${Math.random()}`,
      imageDataUrl: outputImage,
      mimeType: mimeType || 'image/png',
      prompt: prompt,
      timestamp: Date.now(),
    };
    updateLibrary([newImage, ...library]);
  };

  const handleDeleteFromLibrary = (id: string) => {
    const updatedLibrary = library.filter(img => img.id !== id);
    updateLibrary(updatedLibrary);
  };

  const handleUseImageFromLibrary = (image: SavedImage) => {
    const { imageDataUrl, mimeType } = image;
    const base64 = imageDataUrl.split(',')[1];
    
    if (activeTab === FeatureKey.IMAGE_FUSION && inputImage) {
        setInputImage2({ base64, mimeType, dataUrl: imageDataUrl });
    } else {
        setInputImage({ base64, mimeType, dataUrl: imageDataUrl });
        if (activeTab !== FeatureKey.IMAGE_FUSION) {
             setActiveTab(FeatureKey.IMAGE_TO_PHOTO);
        }
    }
    setIsLibraryOpen(false);
  };
  
  const handleExportLibrary = () => {
    if (library.length === 0) return;
    const jsonString = JSON.stringify(library, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-photo-studio-library.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportLibrary = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedData = JSON.parse(text);

        if (!Array.isArray(importedData)) {
          throw new Error('Imported data is not an array.');
        }

        const validImportedImages: SavedImage[] = importedData.filter(item => 
          item.id && typeof item.id === 'string' &&
          item.imageDataUrl && typeof item.imageDataUrl === 'string' &&
          item.prompt && typeof item.prompt === 'string' &&
          item.timestamp && typeof item.timestamp === 'number'
        );

        const existingIds = new Set(library.map(img => img.id));
        const newImages = validImportedImages.filter(img => !existingIds.has(img.id));

        if (newImages.length > 0) {
          updateLibrary([...newImages, ...library]);
          alert(`${T.importSuccess} (${newImages.length})`);
        } else {
          alert(T.noNewImages);
        }

      } catch (error) {
        console.error("Import failed:", error);
        alert(T.importError);
      }
    };
    reader.onerror = () => {
        alert(T.importError);
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!outputImage) return;
    const a = document.createElement('a');
    a.href = outputImage;
    a.download = `ai-photo-studio-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };


  const handleGenerate = async () => {
    setIsLoading(true);
    setOutputImage(null);
    setError(null);

    try {
      const stylePrompt = styles.find(s => s.key === selectedStyle)?.prompt;
      let resultBase64: string;

      if (activeTab === FeatureKey.IMAGE_FUSION && inputImage && inputImage2) {
        resultBase64 = await generateImageFromTwoImages(prompt, inputImage, inputImage2, stylePrompt);
      } else if (activeFeature.requiresImage && inputImage) {
        resultBase64 = await generateImageFromImage(prompt, {
          base64: inputImage.base64,
          mimeType: inputImage.mimeType,
        }, stylePrompt);
      } else {
        resultBase64 = await generateImageFromText(prompt, stylePrompt, aspectRatio);
      }
      setOutputImage(`data:image/png;base64,${resultBase64}`);
    } catch (err) {
      setError(T.errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const isGenerateDisabled = () => {
      if (isLoading || !prompt) return true;
      if (activeTab === FeatureKey.TEXT_TO_PHOTO) return false;
      if (activeTab === FeatureKey.IMAGE_FUSION) return !inputImage || !inputImage2;
      if (activeFeature.requiresImage) return !inputImage;
      return true; // Should not be reached
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <Header
        language={language}
        setLanguage={setLanguage}
        title={T.title}
        onLibraryClick={() => setIsLibraryOpen(true)}
        T={T}
      />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <FeatureTabs features={features} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-6 bg-gray-800/50 rounded-xl shadow-2xl p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Panel: Controls */}
          <div className="flex flex-col space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400">{activeFeature.title}</h2>
              <p className="text-gray-400 mt-1">{activeFeature.description}</p>
            </div>
            
            {activeFeature.key === FeatureKey.IMAGE_FUSION && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <ImageUploader 
                    inputImage={inputImage}
                    onImageUpload={(file) => handleImageUpload(file, 1)}
                    T={T}
                    label={T.uploadImage1}
                 />
                 <ImageUploader 
                    inputImage={inputImage2}
                    onImageUpload={(file) => handleImageUpload(file, 2)}
                    T={T}
                    label={T.uploadImage2}
                 />
              </div>
            )}

            {activeFeature.requiresImage && activeFeature.key !== FeatureKey.IMAGE_FUSION && (
              <ImageUploader 
                inputImage={inputImage}
                onImageUpload={(file) => handleImageUpload(file, 1)}
                T={T}
                label={T.uploadImage}
              />
            )}
            
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              placeholder={activeFeature.promptPlaceholder}
              isListening={isListening}
              onToggleListening={handleToggleListening}
              isSpeechSupported={isSpeechSupported}
            />

            <StyleSelector
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
              styles={styles}
              T={T}
            />

            {activeTab === FeatureKey.TEXT_TO_PHOTO && (
              <AspectRatioSelector
                selectedRatio={aspectRatio}
                setSelectedRatio={setAspectRatio}
                T={T}
              />
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerateDisabled()}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 flex items-center justify-center text-lg"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-3">{T.generating}</span>
                </>
              ) : T.generate}
            </button>
          </div>

          {/* Right Panel: Output */}
          <OutputPanel 
            outputImage={outputImage}
            isLoading={isLoading}
            error={error}
            T={T}
            onSave={handleSaveToLibrary}
            onDownload={handleDownload}
            isSaved={!!library.find(img => img.imageDataUrl === outputImage)}
          />
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        Powered by Google Gemini
      </footer>
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        library={library}
        onDelete={handleDeleteFromLibrary}
        onUseImage={handleUseImageFromLibrary}
        onImport={handleImportLibrary}
        onExport={handleExportLibrary}
        T={T}
      />
    </div>
  );
};

// Sub-components defined within App.tsx for simplicity
const Header: React.FC<{ language: Language, setLanguage: (l: Language) => void, title: string, onLibraryClick: () => void, T: Record<string, string> }> = ({ language, setLanguage, title, onLibraryClick, T }) => (
  <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        <div className="flex items-center space-x-4">
          <button onClick={onLibraryClick} className="flex items-center space-x-2 text-gray-300 hover:text-cyan-400 transition-colors">
              <LibraryIcon />
              <span className='hidden sm:inline'>{T.library}</span>
          </button>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-gray-800 text-white border border-gray-700 rounded-md py-1 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>
      </div>
    </div>
  </header>
);

const FeatureTabs: React.FC<{ features: FeatureConfig[], activeTab: FeatureKey, setActiveTab: (k: FeatureKey) => void }> = ({ features, activeTab, setActiveTab }) => (
  <div className="overflow-x-auto">
    <div className="flex space-x-2 border-b border-gray-700 pb-2">
      {features.map((feature) => (
        <button
          key={feature.key}
          onClick={() => setActiveTab(feature.key)}
          className={`px-4 py-2 text-sm sm:text-base font-medium rounded-t-lg whitespace-nowrap transition-colors duration-200 focus:outline-none ${
            activeTab === feature.key
              ? 'bg-gray-800 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
          }`}
        >
          {feature.title}
        </button>
      ))}
    </div>
  </div>
);

const ImageUploader: React.FC<{ inputImage: { dataUrl: string } | null, onImageUpload: (f: File) => void, T: Record<string, string>, label: string }> = ({ inputImage, onImageUpload, T, label }) => {
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  }
  
  const uniqueId = `file-upload-${label.replace(/\s+/g, '-')}`;

  return (
    <div>
      <div className="mt-1 flex flex-col justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md bg-gray-900/50 h-full">
        {inputImage ? (
          <div className="relative group">
            <img src={inputImage.dataUrl} alt="Preview" className="max-h-36 rounded-md" />
            <label htmlFor={uniqueId} className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {T.changeImage}
            </label>
            <input id={uniqueId} name={uniqueId} type="file" className="sr-only" accept="image/*" onChange={onFileChange}/>
          </div>
        ) : (
          <div className="space-y-1 text-center">
            <UploadIcon />
            <div className="flex text-sm text-gray-500">
              <label htmlFor={uniqueId} className="relative cursor-pointer bg-gray-900 rounded-md font-medium text-cyan-400 hover:text-cyan-500 focus-within:outline-none">
                <span>{label}</span>
                <input id={uniqueId} name={uniqueId} type="file" className="sr-only" accept="image/*" onChange={onFileChange}/>
              </label>
            </div>
            <p className="text-xs text-gray-600">or drag and drop</p>
          </div>
        )}
      </div>
    </div>
  );
}

const PromptInput: React.FC<{ 
    prompt: string, 
    setPrompt: (p: string) => void, 
    placeholder: string,
    isListening: boolean,
    onToggleListening: () => void,
    isSpeechSupported: boolean,
}> = ({ prompt, setPrompt, placeholder, isListening, onToggleListening, isSpeechSupported }) => (
  <div>
    <label htmlFor="prompt" className="block text-sm font-medium text-gray-400">Prompt</label>
    <div className="relative mt-1">
      <textarea
        id="prompt"
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        className="block w-full bg-gray-900/50 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm pr-12"
      />
      {isSpeechSupported && (
        <button 
            type="button"
            onClick={onToggleListening}
            className={`absolute top-2.5 right-2.5 p-1 rounded-full transition-all duration-200 ${isListening ? 'text-red-500 bg-red-500/20 animate-pulse' : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
            aria-label={isListening ? 'Stop listening' : 'Start dictating prompt'}
        >
            <MicrophoneIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  </div>
);

const StyleSelector: React.FC<{
  selectedStyle: StyleKey;
  setSelectedStyle: (s: StyleKey) => void;
  styles: StyleOption[];
  T: Record<string, string>;
}> = ({ selectedStyle, setSelectedStyle, styles, T }) => (
  <div>
    <label htmlFor="style-selector" className="block text-sm font-medium text-gray-400">{T.artisticStyle}</label>
    <select
      id="style-selector"
      value={selectedStyle}
      onChange={(e) => setSelectedStyle(e.target.value as StyleKey)}
      className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
    >
      {styles.map(style => (
        <option key={style.key} value={style.key}>
          {style.name}
        </option>
      ))}
    </select>
  </div>
);

const AspectRatioSelector: React.FC<{
  selectedRatio: AspectRatio;
  setSelectedRatio: (r: AspectRatio) => void;
  T: Record<string, string>;
}> = ({ selectedRatio, setSelectedRatio, T }) => {
  const ratios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  const ratioLabels: Record<AspectRatio, string> = {
    '1:1': 'Square (1:1)',
    '16:9': 'Landscape (16:9)',
    '9:16': 'Portrait (9:16)',
    '4:3': 'Photo (4:3)',
    '3:4': 'Photo (3:4)',
  };

  return (
    <div>
      <label htmlFor="ratio-selector" className="block text-sm font-medium text-gray-400">{T.aspectRatio}</label>
      <select
        id="ratio-selector"
        value={selectedRatio}
        onChange={(e) => setSelectedRatio(e.target.value as AspectRatio)}
        className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
      >
        {ratios.map(ratio => (
          <option key={ratio} value={ratio}>
            {ratioLabels[ratio]}
          </option>
        ))}
      </select>
    </div>
  );
};

const OutputPanel: React.FC<{ outputImage: string | null, isLoading: boolean, error: string | null, T: Record<string, string>, onSave: () => void, isSaved: boolean, onDownload: () => void }> = ({ outputImage, isLoading, error, T, onSave, isSaved, onDownload }) => (
  <div className="bg-gray-900/50 rounded-lg flex items-center justify-center p-4 min-h-[300px] lg:min-h-full relative overflow-hidden border border-gray-700">
    {isLoading && (
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
        <LoadingSpinner />
        <p className="mt-4 text-lg">{T.generating}</p>
      </div>
    )}
    {!isLoading && error && (
      <div className="text-center text-red-400">
        <h3 className="font-bold text-lg">{T.errorTitle}</h3>
        <p className="text-sm">{error}</p>
      </div>
    )}
    {!isLoading && !error && outputImage && (
       <>
        <img src={outputImage} alt="Generated output" className="max-w-full max-h-full object-contain rounded-md" />
        <div className="absolute top-2 right-2 flex space-x-2">
          <button 
            onClick={onSave} 
            disabled={isSaved}
            className="flex items-center space-x-2 bg-gray-800/70 hover:bg-gray-700 disabled:bg-cyan-900 disabled:text-cyan-400 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-lg">
            <SaveIcon />
            <span>{isSaved ? T.saved : T.saveToLibrary}</span>
          </button>
          <button 
            onClick={onDownload} 
            className="flex items-center space-x-2 bg-gray-800/70 hover:bg-gray-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-lg">
            <DownloadIcon />
            <span>{T.download}</span>
          </button>
        </div>
      </>
    )}
    {!isLoading && !error && !outputImage && (
      <div className="text-center text-gray-500">
        <ImageIcon />
        <p className="mt-2 font-semibold">{T.output}</p>
        <p className="text-sm">{T.outputPlaceholder}</p>
      </div>
    )}
  </div>
);

const LibraryModal: React.FC<{ 
    isOpen: boolean, 
    onClose: () => void, 
    library: SavedImage[], 
    onDelete: (id: string) => void, 
    onUseImage: (image: SavedImage) => void,
    onImport: (file: File) => void,
    onExport: () => void,
    T: Record<string, string> 
}> = ({ isOpen, onClose, library, onDelete, onUseImage, onImport, onExport, T }) => {
    if (!isOpen) return null;
    
    const importFileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        importFileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImport(file);
        }
        // Reset to allow re-uploading the same file
        if (importFileInputRef.current) {
            importFileInputRef.current.value = '';
        }
    };


    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="library-title">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 id="library-title" className="text-2xl font-bold text-cyan-400">{T.personalLibrary}</h2>
                    <div className="flex items-center space-x-2">
                        <input type="file" ref={importFileInputRef} onChange={handleFileChange} accept=".json" className="hidden" aria-hidden="true" />
                        <button onClick={handleImportClick} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors">
                            <ImportIcon />
                            <span>{T.import}</span>
                        </button>
                        <button onClick={onExport} disabled={library.length === 0} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors">
                            <ExportIcon />
                            <span>{T.export}</span>
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label={T.close}>
                            <CloseIcon />
                        </button>
                    </div>
                </header>

                <div className="flex-grow p-4 overflow-y-auto">
                    {library.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                           <ImageIcon />
                           <p className="mt-4 text-lg">{T.noSavedImages}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {library.map(image => (
                                <div key={image.id} className="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                                    <img src={image.imageDataUrl} alt={image.prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 flex flex-col justify-end">
                                        <p className="text-xs text-white truncate mb-2" title={image.prompt}>{image.prompt}</p>
                                        <div className="flex items-center justify-around space-x-1">
                                            <button onClick={() => onUseImage(image)} className="flex-1 bg-cyan-500/80 hover:bg-cyan-500 text-white text-xs px-2 py-1 rounded-md transition-colors">{T.useThisImage}</button>
                                            <button onClick={() => onDelete(image.id)} className="bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-md transition-colors" aria-label={`${T.delete} image`}>
                                                <TrashIcon className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
