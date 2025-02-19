import React, { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../NavBar/NavBar";
import Footer from "../Footer/Footer";
import parse from 'html-react-parser';
import SubmitButtonInvestiMate from "../InvestmentPlanning/FormSubmitButton";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import VideoGrid from "../LearningVideosGrid/LearningVideoGrid";

const ResponseDisplay = ({ text }) => {
  if (!text) return null;

  const processText = (text) => {
    const paragraphs = text.split('\n');
    
    return paragraphs.map((paragraph, index) => {
      if (!paragraph.trim()) return null;
      
      const processedText = paragraph
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/₹(\d+(?:,\d+)*(?:\.\d+)?)/g, '<span class="whitespace-nowrap">₹$1</span>')
        .replace(/(\d+(?:,\d+)*(?:\.\d+)?)/g, '<span class="whitespace-nowrap">$1</span>')
        .replace(/(!important|!note|note:|important:)/gi, '<strong class="text-blue-500">$1</strong>');

      return (
        <div key={index} className="mb-4 last:mb-0 leading-relaxed">
          {parse(processedText)}
        </div>
      );
    });
  };

  return (
    <div className="space-y-2">
      {processText(text)}
    </div>
  );
};

const LearnPath = () => {
  const [formData, setFormData] = useState({
    preferred_language: "",
    location: "",
    age: "",
    learning_path_type: "",
    learning_topic: "",
  });
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Speech Recognition Hook
  const { 
    transcript, 
    resetTranscript, 
    browserSupportsSpeechRecognition 
  } = useSpeechRecognition();

  // Update learning topic when transcript changes
  useEffect(() => {
    if (transcript) {
      setFormData(prev => ({ ...prev, learning_topic: transcript }));
    }
  }, [transcript]);

  // Languages of India (Native and Official)
  const indianLanguages = [
    "Hindi", "English", "Bengali", "Telugu", "Marathi", "Tamil", 
    "Urdu", "Gujarati", "Kannada", "Malayalam", "Odia", "Punjabi", 
    "Assamese", "Sanskrit", "Konkani", "Manipuri", "Nepali"
  ];

  // States of India
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", 
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", 
    "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
    "Ladakh", "Lakshadweep", "Puducherry"
  ];

  // Download PDF functionality
  const downloadPDF = () => {
    if (!response) return;

    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    // Set font styles
    doc.setFont('helvetica');
    doc.setFontSize(12);

    // Add title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Personalized Learning Path', 20, 20);

    // Add user details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Language: ${formData.preferred_language}`, 20, 30);
    doc.text(`Location: ${formData.location}`, 20, 36);
    doc.text(`Age: ${formData.age}`, 20, 42);
    doc.text(`Learning Path: ${formData.learning_path_type}`, 20, 48);
    doc.text(`Topic: ${formData.learning_topic}`, 20, 54);

    // Split the response into lines that fit the PDF width
    const splitText = doc.splitTextToSize(response, 170);

    // Add response text
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(splitText, 20, 70);

    // Save the PDF
    doc.save(`LearnPath_${formData.learning_topic}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Toggle speech recognition for learning topic
  const toggleListening = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
      setIsListening(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  
  
  const formatDataToString = () => {
    return `Output strictly in ${formData.preferred_language}. Generate only bulleted points with REAL, WORKING resource links.

      Requirements:
      - Every resource mentioned MUST include a direct, working URL
      - Each week must have at least 2 specific online resources
      - Include active YouTube channels where relevant
      - Reference real local organizations in ${formData.location}

      Format:
      - Week [number]: [topic]
        - Specific task/learning
        - Resource: [exact name with URL]
        - Local resource: [organization name with location]
        - Practical exercise with example
        - Time required: [X] hours

      Learning path for:
      - Language: ${formData.preferred_language}
      - Location: ${formData.location}
      - Age: ${formData.age}
      - Level: ${formData.learning_path_type}
      - Goal: ${formData.learning_topic}

      Required sections:
      1. Online Learning Resources:
        • Specific MOOC courses with URLs
        • YouTube channels with direct links
        • Government portals with exact website
        • E-learning platforms with course links

      2. Local Resources in ${formData.location}:
        • Training centers with addresses
        • Business support organizations
        • Mentorship programs
        • Community centers

      3. Free Learning Materials:
        • PDF guides with download links
        • Free course websites
        • Government resources
        • Educational videos

      4. Weekly Action Plan:
        • Specific tasks
        • Resource to use (with link)
        • Practice exercise
        • Expected outcome

      Response rules:
      - Include ONLY real, verifiable resources
      - Every learning resource must have a URL
      - Local resources must have actual names and locations
      - All content in ${formData.preferred_language}
      - Age-appropriate for ${formData.age} years
      - Include exact time commitments
      - Focus on free/affordable options
      - No explanatory text - only structured points`;
      };

  const validateForm = () => {
    const fields = Object.entries(formData);
    for (const [key, value] of fields) {
      if (key !== "learning_topic" && (!value || value.trim() === "")) {
        setErrorMessage(`Please enter your ${key.replace("_", " ")}`);
        return false;
      }
    }
    
    if (formData.age && (isNaN(formData.age) || parseInt(formData.age) < 13 || parseInt(formData.age) > 100)) {
      setErrorMessage("Please enter a valid age between 13 and 100");
      return false;
    }

    return true;
  };

  const sendDataToAPI = () => {
    if (!validateForm()) return;

    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
    }

    setIsLoading(true);
    setErrorMessage("");

    const requestData = {
      message: formatDataToString(),
    };

    axios
      .post("/api/chat", requestData)
      .then((response) => {
        setResponse(response.data.message);
      })
      .catch((error) => {
        console.error("Error:", error);
        setErrorMessage(
          error.response?.data?.error || "Something went wrong. Please try again."
        );
      })
      .finally(() => {
        setIsLoading(false);
        resetTranscript();
      });
  };

  // Check browser speech recognition support
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="text-red-500">
        Browser doesn't support speech recognition.
      </div>
    );
  }

  return (
    <>
    <NavBar/>
    <div className="lg:flex gap-8 p-8 mt-8 flex-1">
      <div className="lg:w-[46%]">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <h1 className="text-3xl font-bold mt-10 mb-1 bg-gradient-to-r from-pink-500 to-purple-900 bg-clip-text text-transparent">
            Financial Education Plan
          </h1>

          <select
            name="preferred_language"
            value={formData.preferred_language}
            onChange={handleInputChange}
            required
            className="w-full p-3 bg-zinc-900/90 text-white rounded-lg"
          >
            <option value="">Select Preferred Language</option>
            {indianLanguages.map((language) => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>

          <select
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
            className="w-full p-3 bg-zinc-900/90 text-white rounded-lg"
          >
            <option value="">Select Your State</option>
            {indianStates.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            placeholder="Your Age"
            required
            className="w-full p-3 bg-zinc-900/50 text-white rounded-lg"
          />

          <select
            name="learning_path_type"
            value={formData.learning_path_type}
            onChange={handleInputChange}
            required
            className="w-full p-3 bg-zinc-900/90 text-white rounded-lg"
          >
            <option value="">Select Learning Path Type</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Professional">Professional Certification</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="text"
              name="learning_topic"
              value={formData.learning_topic}
              onChange={handleInputChange}
              placeholder="What specific financial topic do you want to learn?"
              className="flex-grow p-3 bg-zinc-900/50 text-white rounded-lg"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-full transition-colors ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              title={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? (
                <MicOff className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5 text-white" />
              )}
            </button>
          </div>

          <SubmitButtonInvestiMate
            onClick={sendDataToAPI}
            disabled={isLoading}
          >
          </SubmitButtonInvestiMate>

          <h1 className="text-xl font-bold mt-10 mb-1 bg-gradient-to-r from-green-500 to-purple-900 bg-clip-text text-transparent">
            Scroll down for more resources !!
          </h1>

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}
        </form>
      </div>

      {/* Response Section */}
      {(response || isLoading) && (
        <div className="lg:w-[45%] lg:absolute right-8 top-[10%] mt-10 lg:mt-0 max-h-[75vh] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="w-full rounded-lg border border-gray-700 bg-zinc-800/50 backdrop-blur-sm shadow-lg">
            <div className="border-b border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Your Personalized Learning Path</h3>
              {response && (
                <button 
                  onClick={downloadPDF} 
                  className="text-white hover:text-pink-500 transition-colors"
                  title="Download PDF"
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-150"></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-300"></div>
                    </div>
                  <span className="text-gray-400">Crafting your personalized learning path...</span>
                </div>
              ) : (
                <ResponseDisplay text={response} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    <VideoGrid></VideoGrid>
    <Footer/>
    </>
  );
};

export default LearnPath;