import { useState } from 'react';
import { leadAPI } from '../../services/api';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const UploadLeads = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (['csv', 'xlsx', 'xls'].includes(ext)) {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast.error('Please upload a CSV or Excel file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await leadAPI.uploadLeads(formData);
      setResult(response.data.data);
      toast.success(response.data.message);
      setFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Leads</h1>
        <p className="text-gray-600 mt-1">Upload CSV or Excel file to distribute leads automatically</p>
      </div>

      {/* Upload Card */}
      <div className="card">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-primary-100 p-6 rounded-full mb-6">
            <Upload className="h-12 w-12 text-primary-600" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Lead File</h3>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Upload a CSV or Excel file containing lead information. The system will automatically distribute leads evenly among active salespeople.
          </p>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />

          <label
            htmlFor="file-upload"
            className="btn-primary cursor-pointer inline-flex items-center space-x-2"
          >
            <FileText className="h-5 w-5" />
            <span>Choose File</span>
          </label>

          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Selected file:</span> {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Size: {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-4 btn-primary disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload & Distribute'}
            </button>
          )}
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-start space-x-4">
            <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Upload Successful!</h3>
              <p className="text-green-800 mb-4">
                {result.totalLeads} leads have been uploaded and distributed among {Object.keys(result.distribution).length} salespeople.
              </p>
              
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Distribution Summary:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(result.distribution).map(([salespersonId, count]) => (
                    <div key={salespersonId} className="text-sm">
                      <span className="text-gray-600">Salesperson:</span>
                      <span className="ml-2 font-semibold text-gray-900">{count} leads</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">File Format Instructions</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>Your CSV or Excel file should contain the following columns (case-insensitive headers are accepted):</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Date</strong> (optional) - Lead date (e.g., 2025-10-01)</li>
            <li><strong>name</strong> (required) - Lead's full name</li>
            <li><strong>email</strong> (optional) - Email address</li>
            <li><strong>phonenumber</strong> (required) - Contact phone number</li>
            <li><strong>Country</strong> (required) - Country name or code</li>
            <li><strong>Product</strong> (optional) - Product or package</li>
            <li><strong>Status</strong> (optional) - fresh | follow-up | closed | dead</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-xs">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              <strong>Note:</strong> Leads will be automatically distributed evenly among all active salespeople in the system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadLeads;
