import { FeatureKey, Language, LocalizedFeatures, LocalizedStyles, StyleKey } from './types';

export const UI_TEXT: { [key in Language]: Record<string, string> } = {
  en: {
    title: "AI Photo Studio",
    generate: "Generate",
    uploadImage: "Upload an image",
    uploadImage1: "Upload Image 1",
    uploadImage2: "Upload Image 2",
    changeImage: "Change Image",
    uploading: "Uploading...",
    generating: "Generating with AI...",
    errorTitle: "An error occurred",
    errorMessage: "Could not generate image. Please check your prompt or try again later.",
    dropOrClick: "Drop image here or click to upload",
    imagePreview: "Image Preview",
    output: "Output",
    outputPlaceholder: "Your generated image will appear here.",
    library: "Library",
    saveToLibrary: "Save to Library",
    saved: "Saved",
    personalLibrary: "Personal Library",
    noSavedImages: "You haven't saved any images yet.",
    delete: "Delete",
    useThisImage: "Use this Image",
    close: "Close",
    import: "Import",
    export: "Export",
    importSuccess: "Library imported successfully.",
    importError: "Failed to import library. The file may be corrupt or in the wrong format.",
    noNewImages: "No new images were found to import.",
    artisticStyle: "Artistic Style",
    aspectRatio: "Aspect Ratio",
    download: "Download",
  },
  vi: {
    title: "Tạo ảnh AI",
    generate: "Tạo ảnh",
    uploadImage: "Tải ảnh lên",
    uploadImage1: "Tải ảnh 1",
    uploadImage2: "Tải ảnh 2",
    changeImage: "Đổi ảnh",
    uploading: "Đang tải lên...",
    generating: "Đang tạo bằng AI...",
    errorTitle: "Đã xảy ra lỗi",
    errorMessage: "Không thể tạo ảnh. Vui lòng kiểm tra mô tả hoặc thử lại sau.",
    dropOrClick: "Kéo thả ảnh vào đây hoặc nhấn để tải lên",
    imagePreview: "Xem trước ảnh",
    output: "Kết quả",
    outputPlaceholder: "Ảnh được tạo sẽ xuất hiện ở đây.",
    library: "Thư viện",
    saveToLibrary: "Lưu vào thư viện",
    saved: "Đã lưu",
    personalLibrary: "Thư viện cá nhân",
    noSavedImages: "Bạn chưa lưu ảnh nào.",
    delete: "Xóa",
    useThisImage: "Dùng ảnh này",
    close: "Đóng",
    import: "Nhập",
    export: "Xuất",
    importSuccess: "Nhập thư viện thành công.",
    importError: "Không thể nhập thư viện. Tệp có thể bị hỏng hoặc sai định dạng.",
    noNewImages: "Không tìm thấy ảnh mới để nhập.",
    artisticStyle: "Phong cách nghệ thuật",
    aspectRatio: "Tỷ lệ khung hình",
    download: "Tải về",
  }
};

export const FEATURES_CONFIG: { [key in FeatureKey]: { requiresImage: boolean } } = {
  [FeatureKey.TEXT_TO_PHOTO]: { requiresImage: false },
  [FeatureKey.IMAGE_TO_PHOTO]: { requiresImage: true },
  [FeatureKey.IMAGE_FUSION]: { requiresImage: true }, // Technically needs 2, handled in component
  [FeatureKey.AI_MODEL]: { requiresImage: true },
  [FeatureKey.EDIT_PHOTO]: { requiresImage: true },
};

export const LOCALIZED_FEATURES: { [key in Language]: LocalizedFeatures } = {
  en: {
    [FeatureKey.TEXT_TO_PHOTO]: {
      title: "Text-to-Photo",
      description: "AI will generate a complete photo based on your description.",
      promptPlaceholder: "e.g., A female model in a red dress, posing by the sea, sunset lighting",
    },
    [FeatureKey.IMAGE_TO_PHOTO]: {
      title: "Image-to-Photo",
      description: "Upload a portrait and describe the changes you want. Transform outfits, hairstyles, or backgrounds.",
      promptPlaceholder: "e.g., Change her outfit to a black leather jacket and the background to a neon-lit city street at night",
    },
    [FeatureKey.IMAGE_FUSION]: {
      title: "Image Fusion",
      description: "Upload two photos and describe how you want the AI to combine them into a unique creation.",
      promptPlaceholder: "e.g., Place the person from image 1 into the scene from image 2",
    },
    [FeatureKey.AI_MODEL]: {
      title: "AI Model",
      description: "For fashion and e-commerce. Upload a product photo and let AI generate a model wearing it.",
      promptPlaceholder: "e.g., Place this handbag on the arm of a fashion model walking in Paris",
    },
    [FeatureKey.EDIT_PHOTO]: {
      title: "AI Photo Editing",
      description: "Automatically beautify faces, change backgrounds, or turn a selfie into a professional headshot.",
      promptPlaceholder: "e.g., Remove the background, improve skin lighting, and make it a professional linkedin profile picture",
    },
  },
  vi: {
    [FeatureKey.TEXT_TO_PHOTO]: {
      title: "Tạo ảnh từ văn bản",
      description: "AI sẽ tạo ra một bức ảnh hoàn chỉnh theo mô tả của bạn.",
      promptPlaceholder: "VD: Người mẫu nữ mặc váy đỏ, tạo dáng bên biển, ánh sáng hoàng hôn",
    },
    [FeatureKey.IMAGE_TO_PHOTO]: {
      title: "Tạo ảnh từ ảnh có sẵn",
      description: "Tải lên ảnh chân dung và mô tả thay đổi bạn muốn. Biến đổi trang phục, kiểu tóc, hoặc phong cảnh.",
      promptPlaceholder: "VD: Đổi trang phục thành áo khoác da đen và nền thành đường phố buổi đêm với đèn neon",
    },
    [FeatureKey.IMAGE_FUSION]: {
      title: "Kết hợp ảnh",
      description: "Tải lên hai ảnh và mô tả cách bạn muốn AI kết hợp chúng thành một tác phẩm độc đáo.",
      promptPlaceholder: "VD: Đặt người trong ảnh 1 vào bối cảnh của ảnh 2",
    },
    [FeatureKey.AI_MODEL]: {
      title: "Tạo người mẫu AI",
      description: "Dành cho thời trang và thương mại điện tử. Tải ảnh sản phẩm và AI sẽ tạo người mẫu mặc nó.",
      promptPlaceholder: "VD: Đặt chiếc túi xách này lên tay một người mẫu thời trang đang đi dạo ở Paris",
    },
    [FeatureKey.EDIT_PHOTO]: {
      title: "Chỉnh sửa ảnh bằng AI",
      description: "Tự động làm đẹp khuôn mặt, thay đổi hậu cảnh, hoặc biến ảnh selfie thành ảnh chân dung chuyên nghiệp.",
      promptPlaceholder: "VD: Xóa nền, cải thiện ánh sáng da, và biến nó thành ảnh đại diện linkedin chuyên nghiệp",
    },
  }
};

export const LOCALIZED_STYLES: { [key in Language]: LocalizedStyles } = {
  en: {
    [StyleKey.NONE]: {
      name: 'Default Style',
      prompt: '',
    },
    [StyleKey.REALISTIC]: {
        name: 'Hyper-Realistic',
        prompt: 'photo-realistic, DSLR, 8k, real skin texture',
    },
    [StyleKey.ARTISTIC]: {
        name: 'Artistic',
        prompt: 'cinematic, soft lighting, artistic composition',
    },
    [StyleKey.PORTRAIT]: {
        name: 'Close-up Portrait',
        prompt: 'close-up portrait, depth of field, bokeh',
    },
    [StyleKey.VINTAGE]: {
      name: 'Vintage',
      prompt: 'vintage photo, grainy film, retro aesthetic, 1970s style',
    },
    [StyleKey.CINEMATIC]: {
      name: 'Cinematic',
      prompt: 'cinematic lighting, dramatic atmosphere, high detail, wide angle shot, movie still',
    },
    [StyleKey.WATERCOLOR]: {
      name: 'Watercolor',
      prompt: 'watercolor painting, soft brush strokes, vibrant colors, artistic',
    },
    [StyleKey.NEON_PUNK]: {
      name: 'Neon Punk',
      prompt: 'neon punk aesthetic, cyberpunk, vibrant glowing colors, futuristic city, moody lighting',
    },
    [StyleKey.THREE_D_RENDER]: {
      name: '3D Render',
      prompt: '3D render, photorealistic, high detail, octane render, trending on artstation',
    },
  },
  vi: {
    [StyleKey.NONE]: {
      name: 'Phong cách mặc định',
      prompt: '',
    },
    [StyleKey.REALISTIC]: {
        name: 'Siêu thực',
        prompt: 'photo-realistic, DSLR, 8k, real skin texture',
    },
    [StyleKey.ARTISTIC]: {
        name: 'Nghệ thuật',
        prompt: 'cinematic, soft lighting, artistic composition',
    },
    [StyleKey.PORTRAIT]: {
        name: 'Chân dung cận cảnh',
        prompt: 'close-up portrait, depth of field, bokeh',
    },
    [StyleKey.VINTAGE]: {
      name: 'Cổ điển (Vintage)',
      prompt: 'ảnh cổ điển, film nhiễu hạt, thẩm mỹ retro, phong cách 1970s',
    },
    [StyleKey.CINEMATIC]: {
      name: 'Điện ảnh (Cinematic)',
      prompt: 'ánh sáng điện ảnh, không khí kịch tính, chi tiết cao, góc rộng, cảnh phim',
    },
    [StyleKey.WATERCOLOR]: {
      name: 'Màu nước',
      prompt: 'tranh màu nước, nét cọ mềm mại, màu sắc rực rỡ, nghệ thuật',
    },
    [StyleKey.NEON_PUNK]: {
      name: 'Neon Punk',
      prompt: 'thẩm mỹ neon punk, cyberpunk, màu sắc phát sáng rực rỡ, thành phố tương lai, ánh sáng u tối',
    },
    [StyleKey.THREE_D_RENDER]: {
      name: 'Kết xuất 3D',
      prompt: 'kết xuất 3D, siêu thực, chi tiết cao, octane render, thịnh hành trên artstation',
    },
  }
};