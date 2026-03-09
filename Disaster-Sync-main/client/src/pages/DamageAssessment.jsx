import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MdCloudUpload, MdAssessment, MdDelete, MdCheckCircle, MdWarning } from 'react-icons/md';

export default function DamageAssessment() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [area, setArea] = useState(150);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [myAssessments, setMyAssessments] = useState([]);
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        fetchMyAssessments();
    }, []);

    const fetchMyAssessments = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/damage-assessment/my-assessments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyAssessments(res.data);
        } catch (error) {
            console.error('Failed to fetch assessments:', error);
        }
    };

    // Unified PDF Generator
    const createAssessmentPDF = async (assessment) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        let currentY = 20;

        // --- HEADER ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("Verified Fire Damage Assessment Report", pageWidth / 2, currentY, { align: 'center' });
        currentY += 5;
        doc.setLineWidth(0.5);
        doc.line(10, currentY, pageWidth - 10, currentY);
        currentY += 15;

        // --- Helper for Sections ---
        const addSectionHeader = (title, y) => {
            doc.setFillColor(230, 230, 230); // Light Grey
            doc.rect(margin - 4, y - 6, pageWidth - (margin * 2) + 8, 10, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(title, margin, y);
            return y + 10;
        };

        // --- 1. Incident Overview ---
        currentY = addSectionHeader("1. Incident Overview", currentY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        const prediction = assessment.prediction ? assessment.prediction.charAt(0).toUpperCase() + assessment.prediction.slice(1) : "Unknown";
        const confidence = assessment.confidence ? assessment.confidence.toFixed(2) + "%" : "0%";
        const areaStr = (assessment.affectedArea || 0) + " Sq. Ft.";
        const dateStr = new Date(assessment.createdAt || new Date()).toLocaleDateString('en-CA');

        doc.text(`Classification: ${prediction}`, margin, currentY);
        doc.text(`Assessed Area: ${areaStr}`, margin, currentY + 7);
        doc.text(`AI Confidence: ${confidence}`, 110, currentY);
        doc.text(`Date of Assessment: ${dateStr}`, 110, currentY + 7);
        currentY += 20;

        // --- 2. Financial Estimation ---
        currentY = addSectionHeader("2. Financial Estimation (INR)", currentY);
        currentY += 5;
        const costs = assessment.estimatedCosts || {};
        const fmt = (num) => (num || 0).toLocaleString('en-IN');

        const financialData = [
            ['Labor & Workforce', `INR ${fmt(costs.laborCost)}`],
            ['Raw Materials & Supplies', `INR ${fmt(costs.materialCost)}`],
            ['Debris Removal & Cleanup', `INR ${fmt(costs.cleanupCost)}`],
            [{ content: 'NET REPAIR ESTIMATE', styles: { fontStyle: 'bold' } }, { content: `INR ${fmt(costs.repairCost)}`, styles: { fontStyle: 'bold' } }]
        ];

        autoTable(doc, {
            startY: currentY,
            head: [['Item Description', 'Cost (AI Estimated)']],
            body: financialData,
            theme: 'grid',
            styles: { font: 'helvetica', fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [66, 66, 66], textColor: [255, 255, 255], fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50, halign: 'right' } },
            margin: { left: margin },
        });

        currentY = doc.lastAutoTable.finalY + 10;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 0, 0); // Warning red
        doc.text(`AI Recommended Reserve for Full Rebuild: INR ${fmt(costs.rebuildCost)}`, margin, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 15;

        // --- 3. Compromised Structural Elements ---
        currentY = addSectionHeader("3. Compromised Structural Elements & Hazards", currentY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const materials = assessment.detectedMaterials || [];
        if (materials.length > 0 && materials[0] !== 'None') {
            let colX = margin;
            let rowY = currentY;
            materials.forEach((mat, i) => {
                doc.text(`- ${mat}`, colX, rowY);
                if (i % 2 === 0) colX = 110; else { colX = margin; rowY += 6; }
            });
            currentY = rowY + 15;
        } else {
            doc.text("- No specialized hazards detected by AI", margin, currentY);
            currentY += 15;
        }

        // --- 4. AI Damage Visualization ---
        if (currentY > 180) { doc.addPage(); currentY = 20; }
        currentY = addSectionHeader("4. AI Damage Visualization (Proof of Damage)", currentY);

        const imgWidth = 85;
        const imgHeight = 65;

        const getFullUrl = (url) => {
            if (!url) return null;
            if (url.startsWith('blob:') || url.startsWith('http')) return url;
            return `http://localhost:5000${url}`;
        };

        // Use imageUrl from assessment, or fallback to current previewUrl if it's the immediate result
        const originalUrl = getFullUrl(assessment.imageUrl) || previewUrl;
        const heatUrl = getFullUrl(assessment.heatmapUrl);

        try {
            if (originalUrl) {
                doc.text("Original Damage Photo", 10, currentY + 5);
                doc.addImage(originalUrl, 'JPEG', 10, currentY + 10, imgWidth, imgHeight);
            }
            if (heatUrl) {
                doc.text("AI Severity Heatmap", 100, currentY + 5);
                doc.addImage(heatUrl, 'PNG', 100, currentY + 10, imgWidth, imgHeight);
            }
        } catch (imgErr) {
            console.error("Error adding images to PDF:", imgErr);
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text("(Visual proof could not be rendered in PDF; view online for details)", margin, currentY + 20);
            doc.setTextColor(0, 0, 0);
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`FireFusion Verified AI Assessment | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }

        return doc;
    };

    const handleRequestAid = async (assessment) => {
        try {
            if (!assessment) return;

            setLoading(true);
            console.log("Generating unified report for aid request...");

            // Call the shared PDF generator
            const doc = await createAssessmentPDF(assessment);

            // Convert PDF to Blob
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], `verified-report-${assessment._id}.pdf`, { type: 'application/pdf' });

            // Upload to Backend
            const formData = new FormData();
            formData.append('report', pdfFile);

            await axios.patch(`http://localhost:5000/api/damage-assessment/${assessment._id}/request-donation`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('✅ Aid request raised successfully! The official detailed AI report has been uploaded for donors to see.');
            fetchMyAssessments();
        } catch (err) {
            console.error("Aid request failed:", err);
            alert('Failed to raise aid request: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        try {
            if (!result) return;
            console.log("Generating unified download report...");
            const doc = await createAssessmentPDF(result);
            doc.save(`Damage_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Manual PDF Generation failed:", error);
            alert(`Failed to generate PDF: ${error.message}`);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('area', area);

        try {
            const res = await axios.post('http://localhost:5000/api/damage-assessment/assess', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setResult(res.data.assessment);
            fetchMyAssessments(); // Refresh list
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            setError(errorMsg);
            if (errorMsg.includes('Flask')) {
                setError('⚠️ AI Model Service is not running. Please start the Flask server (api_server.py) on port 5001.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this assessment?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/damage-assessment/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMyAssessments();
            if (result && result._id === id) {
                setResult(null);
            }
        } catch (error) {
            alert('Failed to delete assessment: ' + error.message);
        }
    };

    const getSeverityColor = (prediction) => {
        switch (prediction) {
            case 'nondamaged': return 'text-green-600 bg-green-100';
            case 'mild': return 'text-yellow-700 bg-yellow-100';
            case 'moderate': return 'text-orange-700 bg-orange-100';
            case 'severe': return 'text-red-700 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getSeverityIcon = (prediction) => {
        switch (prediction) {
            case 'nondamaged': return <MdCheckCircle className="text-green-600" />;
            case 'mild': return <MdWarning className="text-yellow-600" />;
            case 'moderate': return <MdWarning className="text-orange-600" />;
            case 'severe': return <MdWarning className="text-red-600" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                        🔥 Fire Damage Assessment
                    </h1>
                    <p className="text-gray-600">
                        Upload an image of fire damage to get instant AI-powered severity analysis and cost estimates
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <div className="bg-white rounded-lg shadow-md p-6 h-fit">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <MdCloudUpload className="mr-2" />
                            Upload Damage Photo
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700">Select Image</label>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={handleFileChange}
                                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Accepted formats: JPEG, JPG, PNG (Max 10MB)
                                </p>
                            </div>

                            {previewUrl && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium mb-2 text-gray-700">Preview</p>
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full rounded border shadow-sm max-h-64 object-contain bg-gray-50"
                                    />
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                    Affected Area (sq. ft.)
                                    <span className="text-xs text-gray-500 ml-2 font-normal">
                                        Enter ONLY damaged area size
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    value={area}
                                    onChange={(e) => setArea(e.target.value)}
                                    min="10"
                                    max="5000"
                                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                                <div className="mt-2 bg-blue-50 p-3 rounded text-xs text-gray-700">
                                    <p className="font-semibold mb-1">💡 How to measure:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Small corner/cabinet: 50-100 sq.ft</li>
                                        <li>One room: 150-250 sq.ft</li>
                                        <li>Multiple rooms: 300-500 sq.ft</li>
                                        <li>Entire floor: 800-1500 sq.ft</li>
                                    </ul>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !selectedFile}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Analyzing Damage...
                                    </>
                                ) : (
                                    <>
                                        <MdAssessment className="mr-2" size={20} />
                                        Assess Damage
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Results Section */}
                    {result && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                📊 Assessment Results
                            </h2>

                            <div className="space-y-4">
                                {/* Classification & Confidence */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded border">
                                        <p className="text-sm text-gray-600 mb-1">Classification</p>
                                        <div className={`text-2xl font-bold px-3 py-1 rounded inline-flex items-center ${getSeverityColor(result.prediction)}`}>
                                            {getSeverityIcon(result.prediction)}
                                            <span className="ml-2">{result.prediction.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded border">
                                        <p className="text-sm text-gray-600 mb-1">AI Confidence</p>
                                        <p className="text-2xl font-bold text-blue-600">{result.confidence}%</p>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${result.confidence}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Cost Estimation */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-5 rounded-lg border-l-4 border-orange-600 shadow-sm">
                                        <p className="text-sm text-gray-700 font-medium mb-1">Repair Estimate</p>
                                        <p className="text-3xl font-bold text-orange-700">
                                            ₹{result.estimatedCosts.repairCost.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-lg border-l-4 border-gray-600 shadow-sm">
                                        <p className="text-sm text-gray-700 font-medium mb-1">Rebuild Value</p>
                                        <p className="text-3xl font-bold text-gray-700">
                                            ₹{result.estimatedCosts.rebuildCost?.toLocaleString('en-IN') || '0'}
                                        </p>
                                    </div>
                                </div>

                                {/* Cost Breakdown */}
                                <div className="bg-white p-6 rounded border shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                        💰 Cost Breakdown
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="flex items-center text-gray-700">🛠️ Labor</span>
                                                <span className="font-semibold">₹{result.estimatedCosts.laborCost?.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(result.estimatedCosts.laborCost / result.estimatedCosts.repairCost) * 100}%` }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="flex items-center text-gray-700">🧱 Materials</span>
                                                <span className="font-semibold">₹{result.estimatedCosts.materialCost?.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(result.estimatedCosts.materialCost / result.estimatedCosts.repairCost) * 100}%` }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="flex items-center text-gray-700">🚛 Cleanup</span>
                                                <span className="font-semibold">₹{result.estimatedCosts.cleanupCost?.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(result.estimatedCosts.cleanupCost / result.estimatedCosts.repairCost) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detected Hazards */}
                                {result.detectedMaterials && result.detectedMaterials.length > 0 && result.detectedMaterials[0] !== 'None' && (
                                    <div className="bg-yellow-50 p-6 rounded border border-yellow-200">
                                        <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center">
                                            ⚠️ Detected Hazards / Materials
                                        </h3>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {result.detectedMaterials.map((material, idx) => (
                                                <li key={idx} className="flex items-center text-gray-800">
                                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                                    {material}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <hr className="border-gray-200" />
                            </div>

                            {/* PDF Download Button */}
                            <div className="mt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">📄 Official Claim Report</h3>
                                        <p className="text-gray-600 text-sm">Download the detailed itemized report for insurance filing.</p>
                                    </div>
                                    <button
                                        onClick={generatePDF}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg flex items-center shadow-lg transition-transform transform hover:scale-105"
                                    >
                                        <span className="mr-2">📥</span> Generate PDF Report
                                    </button>
                                </div>
                                <div className="my-4">
                                    <hr className="border-gray-200" />
                                </div>
                            </div>

                            {/* Heatmap */}
                            {result.heatmapUrl && (
                                <div>
                                    <p className="text-sm font-medium mb-2 text-gray-700">🎯 AI Damage Heatmap</p>
                                    <img
                                        src={result.heatmapUrl}
                                        alt="Damage Heatmap"
                                        className="w-full rounded border shadow-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Red areas indicate where the AI detected the most severe damage
                                    </p>
                                </div>
                            )}

                            {/* Probabilities */}
                            {result.probabilities && (
                                <div className="bg-blue-50 p-4 rounded border">
                                    <p className="text-sm font-semibold mb-3 text-gray-700">Probability Distribution</p>
                                    <div className="space-y-2">
                                        {Object.entries(result.probabilities).map(([key, value]) => (
                                            <div key={key} className="flex items-center">
                                                <span className="text-xs w-24 capitalize text-gray-600">{key}:</span>
                                                <div className="flex-1 bg-gray-200 rounded-full h-4 mr-2">
                                                    <div
                                                        className="bg-blue-600 h-4 rounded-full"
                                                        style={{ width: `${value}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold w-12 text-right">{value.toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Insurance Tip */}
                            <div className="bg-green-50 p-4 rounded border border-green-200">
                                <p className="text-sm font-semibold mb-2 text-green-800 flex items-center">
                                    <MdCheckCircle className="mr-2" />
                                    Insurance Claim Tip
                                </p>
                                <p className="text-sm text-gray-700">
                                    This AI assessment provides valuable documentation for your insurance claim.
                                    Save this assessment and share it with your insurance provider to expedite processing.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Previous Assessments */}
                {myAssessments.length > 0 && (
                    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">📋 Your Previous Assessments</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myAssessments.map((assessment) => (
                                <div
                                    key={assessment._id}
                                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer relative"
                                    onClick={() => setResult(assessment)}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(assessment._id);
                                        }}
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                        title="Delete assessment"
                                    >
                                        <MdDelete size={20} />
                                    </button>

                                    <div className={`font-bold text-lg mb-2 px-2 py-1 rounded inline-flex items-center ${getSeverityColor(assessment.prediction)}`}>
                                        {getSeverityIcon(assessment.prediction)}
                                        <span className="ml-1">{assessment.prediction.toUpperCase()}</span>
                                    </div>

                                    <div className="space-y-1 text-sm text-gray-600 mt-3">
                                        <p>Confidence: <span className="font-semibold">{assessment.confidence}%</span></p>
                                        <p>Area: <span className="font-semibold">{assessment.affectedArea} sq.ft</span></p>
                                    </div>

                                    <p className="text-xl font-bold text-orange-600 mt-3">
                                        ₹{assessment.estimatedCosts.repairCost.toLocaleString('en-IN')}
                                    </p>

                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(assessment.createdAt).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>

                                    {/* Request Aid Button for History */}
                                    <div className="mt-4 pt-3 border-t border-gray-100">
                                        {!assessment.donation?.requested ? (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await handleRequestAid(assessment);
                                                }}
                                                className="w-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center text-sm"
                                            >
                                                <span className="mr-2">🤝</span> Request Aid
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-center text-green-600 font-semibold text-sm py-2">
                                                <MdCheckCircle className="mr-2" /> Request Active
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {myAssessments.length === 0 && !result && (
                    <div className="mt-8 bg-white rounded-lg shadow-md p-12 text-center">
                        <MdAssessment size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Assessments Yet</h3>
                        <p className="text-gray-500">
                            Upload your first damage image to get started with AI-powered assessment
                        </p>
                    </div>
                )}
            </div>
        </div >
    );
}
