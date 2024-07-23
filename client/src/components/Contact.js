import React, { Component } from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'


export default class Contact extends Component {
  render() {
    return (
      <div>
        <Container fluid className="p-4">
          <Row className="justify-content-center">
            <Col md={8}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>Contact</Card.Title>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}
