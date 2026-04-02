import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, File, FileWarning } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes: Record<string, string[]>;
  maxSize?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileSelect, 
  acceptedFileTypes, 
  maxSize = 10 * 1024 * 1024 // 10MB default
}) => {
  const [error, setError] = useState<string | null>(null);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setError(null);
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({ 
    onDrop, 
    accept: acceptedFileTypes,
    maxSize,
    multiple: false
  });

  // Handle rejected files
  React.useEffect(() => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError(`File is too large. Max size is ${maxSize / (1024 * 1024)}MB`);
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type. Please upload a CSV, Excel, or JSON file');
      } else {
        setError(rejection.errors[0].message);
      }
    }
  }, [fileRejections, maxSize]);

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 
        isDragReject ? 'border-red-500 bg-red-50' : 
        error ? 'border-red-500 bg-red-50' : 
        'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <input {...getInputProps()} />
      
      <div className="space-y-4">
        {error ? (
          <>
            <FileWarning className="mx-auto h-12 w-12 text-red-500" />
            <p className="text-red-500">{error}</p>
          </>
        ) : isDragActive ? (
          <>
            <FileUp className="mx-auto h-12 w-12 text-blue-500 animate-bounce" />
            <p className="text-blue-500 font-medium">Drop your file here</p>
          </>
        ) : (
          <>
            <File className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-gray-600 font-medium">
                Drag & drop your file here, or click to select
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports CSV, Excel, and JSON files
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUploader;