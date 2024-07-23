import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Button, ListGroup, Alert } from 'react-bootstrap';
import Login from './Login';
import Register from './Register';

const Assessments = ({ isAuthenticated, setIsAuthenticated }) => {
  const [assessments, setAssessments] = useState([]);
  const [registeredAssessments, setRegisteredAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/assessments');
        setAssessments(response.data);
      } catch (error) {
        setError('Failed to fetch assessments');
      }
    };

    const fetchRegisteredAssessments = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:5000/user/assessments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRegisteredAssessments(response.data.map(a => a.id));
      } catch (error) {
        setError('Failed to fetch registered assessments');
      }
    };

    fetchAssessments();
    if (isAuthenticated) {
      fetchRegisteredAssessments();
    }
  }, [isAuthenticated]);

  const handleRegister = async (id) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.post('http://localhost:5000/assessments/register', { assessmentId: id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRegisteredAssessments(prev => [...prev, id]);
      } catch (error) {
        setError('Failed to register');
      }
    }
  };

  const handleUnregister = async (id) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.delete(`http://localhost:5000/assessments/unregister/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRegisteredAssessments(prev => prev.filter(aId => aId !== id));
      } catch (error) {
        setError('Failed to unregister');
      }
    }
  };

  return (
    <Container>
      {error && <Alert variant="danger">{error}</Alert>}
      {!isAuthenticated ? (
        <>
          {showLogin ? (
            <>
              <Login setIsAuthenticated={setIsAuthenticated} />
              <p className="text-center mt-3">
                Don't have an account? <Button variant="link" onClick={() => setShowLogin(false)}>Register</Button>
              </p>
            </>
          ) : (
            <>
              <Register />
              <p className="text-center mt-3">
                Already have an account? <Button variant="link" onClick={() => setShowLogin(true)}>Login</Button>
              </p>
            </>
          )}
        </>
      ) : (
        <>
          <h2>Assessments</h2>
          <ListGroup>
            {assessments.map(assessment => (
              <ListGroup.Item key={assessment.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <h5>{assessment.name}</h5>
                  <p>{assessment.description}</p>
                </div>
                {registeredAssessments.includes(assessment.id) ? (
                  <Button variant="danger" onClick={() => handleUnregister(assessment.id)}>Unregister</Button>
                ) : (
                  <Button variant="primary" onClick={() => handleRegister(assessment.id)}>Register</Button>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </>
      )}
    </Container>
  );
};

export default Assessments;
