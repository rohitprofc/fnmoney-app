import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Button, ListGroup, Alert } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';

const Assessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [registeredAssessments, setRegisteredAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Assuming the authentication state is managed here

  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
    };

    checkAuthentication();
    if (isAuthenticated) {
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
        console.error('Failed to unregister:', error.response ? error.response.data : error.message);
        setError('Failed to unregister');
      }
    }
  };

  if (!isAuthenticated) {
    return (<Navigate to="/login" />);
  }

  return (
    <Container>
      <h2>Assessments</h2>
      {error && <Alert variant="danger">{error}</Alert>}
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
    </Container>
  );
};

export default Assessments;
