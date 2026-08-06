import React, { useState, useEffect } from "react";
import { submitLiveLookIn, getCaptchaChallenge } from "../../services/admissionsService";
import { useNavigate } from "react-router-dom";
import { Alert, Spinner, Card, Form, Button } from "react-bootstrap";
import { Calendar, Phone, Mail, User, ShieldAlert, BadgeCheck, HelpCircle, ArrowLeft } from "lucide-react";

const gradeLevels = [
  "Kindergarten",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
];

const LiveLookInForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "Kindergarten",
    message: "",
  });
  
  // Real Anti-Spam Captcha State
  const [captchaChallenge, setCaptchaChallenge] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Parse Space ID from Query string (?space=13 or ?board_id=13)
  const query = new URLSearchParams(window.location.search);
  const spaceId = query.get("space") || query.get("board_id") || query.get("board") || null;

  const loadCaptcha = async () => {
    try {
      setLoadingCaptcha(true);
      setCaptchaAnswer("");
      const res = await getCaptchaChallenge();
      setCaptchaChallenge(res);
    } catch (e) {
      console.error("Failed to load anti-spam captcha:", e);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError("");
    
    try {
      await submitLiveLookIn({
        ...formData,
        captcha_token: captchaChallenge?.token,
        captcha_answer: captchaAnswer
      }, spaceId);
      
      setSuccess(
        "Thank you! Your request for a Live Look-in tour has been submitted successfully. A representative will contact you shortly."
      );
      setTimeout(() => {
        window.location.href = "https://elaaschool.org/";
      }, 5000);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        "Failed to submit tour request. Please review your info and try again."
      );
      // Reload captcha on failed submit
      loadCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div 
        className="d-flex align-items-center justify-content-center min-h-screen" 
        style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}
      >
        <Card
          className="text-center p-5 border-0 shadow-lg"
          style={{ maxWidth: "500px", borderRadius: "24px" }}
        >
          <Card.Body>
            <div 
              className="d-flex align-items-center justify-content-center mx-auto mb-4 bg-emerald-50 text-emerald-500"
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
              }}
            >
              <BadgeCheck size={40} />
            </div>
            <h2 className="fw-extrabold text-slate-800 mb-3" style={{ fontSize: "24px" }}>
              Request Received!
            </h2>
            <p className="text-slate-500 mb-4 lh-relaxed" style={{ fontSize: "15px" }}>
              {success}
            </p>
            <Button 
              variant="outline-secondary" 
              className="px-4 py-2 text-xs border-slate-200 fw-semibold rounded-3"
              onClick={() => {
                window.location.href = "https://elaaschool.org/";
              }}
            >
              Go to Home Page
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="d-flex flex-column flex-md-row min-h-screen"
      style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#ffffff" }}
    >
      {/* Left Column - Headline Area */}
      <div 
        className="col-12 col-md-5 d-flex flex-column align-items-center justify-content-center text-white px-5 py-5 text-center text-md-start"
        style={{
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
          minHeight: "35vh"
        }}
      >
        <div style={{ maxWidth: "420px" }}>
          <a 
            href="https://www.elaaschool.org/"
            className="d-inline-flex align-items-center gap-2 mb-5 text-decoration-none fw-bold text-xs"
            style={{ color: "#ffffff", opacity: 0.95, transition: "opacity 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.95"}
          >
            <ArrowLeft size={14} color="#ffffff" /> Back to School Website
          </a>
          <h1 className="fw-extrabold mb-3 tracking-tight lh-sm" style={{ fontSize: "38px" }}>
            Schedule a "Live Look-in"
          </h1>
          <p className="text-sky-100 fs-5 fw-medium opacity-90 lh-base">
            Take a free virtual tour of ELA Academy and see our interactive learning environment in action.
          </p>
          <div className="d-none d-md-flex flex-column gap-3.5 mt-5">
            <div className="d-flex align-items-center gap-3 text-sky-100">
              <div className="bg-sky-500/20 p-2.5 rounded-circle"><Calendar size={18} /></div>
              <span className="text-sm font-semibold">Flexible Timings & Schedule</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form Area */}
      <div className="col-12 col-md-7 d-flex align-items-center justify-content-center p-4 p-md-5 bg-slate-50/50">
        <Card 
          className="w-100 border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white"
          style={{ maxWidth: "560px" }}
        >
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="fw-bold text-slate-800 mb-0">Book Your Tour</h3>
                <p className="text-slate-400 text-sm mt-1 mb-0">Fill in the fields below to schedule a look-in.</p>
              </div>
              <a 
                href="https://www.elaaschool.org/"
                className="d-md-none text-sky-600 text-xs fw-semibold text-decoration-none"
              >
                Back to Site
              </a>
            </div>
            
            {error && (
              <Alert variant="danger" className="text-xs d-flex align-items-center gap-2 border-danger-subtle py-2.5">
                <ShieldAlert size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </Alert>
            )}

            <Form onSubmit={handleSubmit} className="d-flex flex-column gap-3.5">
              {/* Name */}
              <Form.Group controlId="tourFormName">
                <Form.Label className="text-xs fw-bold text-slate-600 mb-1">Name</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-slate-50 border-end-0 text-slate-400">
                    <User size={14} />
                  </span>
                  <Form.Control
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    className="border-start-0 text-sm py-2 bg-slate-50/20"
                  />
                </div>
              </Form.Group>

              {/* Email */}
              <Form.Group controlId="tourFormEmail">
                <Form.Label className="text-xs fw-bold text-slate-600 mb-1">Email</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-slate-50 border-end-0 text-slate-400">
                    <Mail size={14} />
                  </span>
                  <Form.Control
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email address"
                    className="border-start-0 text-sm py-2 bg-slate-50/20"
                  />
                </div>
              </Form.Group>

              {/* Phone Number */}
              <Form.Group controlId="tourFormPhone">
                <Form.Label className="text-xs fw-bold text-slate-600 mb-1">Phone Number</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-slate-50 border-end-0 text-slate-400">
                    <Phone size={14} />
                  </span>
                  <Form.Control
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="border-start-0 text-sm py-2 bg-slate-50/20"
                  />
                </div>
              </Form.Group>

              {/* Grade */}
              <Form.Group controlId="tourFormGrade">
                <Form.Label className="text-xs fw-bold text-slate-600 mb-1">Grade</Form.Label>
                <Form.Select
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  className="text-sm py-2 bg-slate-50/20 border-slate-200"
                >
                  {gradeLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Message */}
              <Form.Group controlId="tourFormMessage">
                <Form.Label className="text-xs fw-bold text-slate-600 mb-1">Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us about your tour preference..."
                  className="text-sm py-2 bg-slate-50/20 border-slate-200"
                />
              </Form.Group>

              {/* Real Anti-Spam Captcha Field */}
              <Form.Group controlId="captchaAns">
                <Form.Label className="text-xs fw-bold text-slate-600 mb-1 d-flex justify-content-between align-items-center">
                  <span>Verification Challenge (Anti-Spam)</span>
                  <button 
                    type="button" 
                    className="btn btn-link text-xs p-0 text-sky-600 hover:text-sky-800 text-decoration-none font-semibold" 
                    onClick={loadCaptcha} 
                    disabled={loadingCaptcha}
                  >
                    ↻ Refresh
                  </button>
                </Form.Label>
                <div className="input-group">
                  <span 
                    className="input-group-text bg-slate-50 border-end-0 text-sm font-bold text-slate-600 px-3"
                    style={{ minWidth: "150px", textAlign: "center", display: "inline-block" }}
                  >
                    {loadingCaptcha ? "Loading..." : captchaChallenge?.question}
                  </span>
                  <Form.Control
                    required
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Your answer"
                    className="text-sm py-2 bg-slate-50/20 border-start-0"
                  />
                </div>
              </Form.Group>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="py-2.5 fw-bold border-0 text-white rounded-3 shadow-sm hover:opacity-95 transition-all text-sm mt-2"
                style={{ backgroundColor: "#f59e0b" }}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Submitting...
                  </>
                ) : (
                  "Send Request"
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default LiveLookInForm;
