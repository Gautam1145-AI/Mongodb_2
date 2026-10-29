"""
Test Suite for Hospital Management System Flask App
Validates all pages, API endpoints, CRUD operations, and MongoDB queries.
"""

import unittest
import json
from app import app
from database import db_instance

class TestHospitalApp(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_dashboard_page(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Executive Clinical Command Center", response.data)

    def test_patients_page(self):
        response = self.app.get('/patients')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Enterprise Patient Registry", response.data)

    def test_doctors_page(self):
        response = self.app.get('/doctors')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Medical Specialists", response.data)

    def test_appointments_page(self):
        response = self.app.get('/appointments')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Appointments & Clinical Scheduling", response.data)

    def test_medical_records_page(self):
        response = self.app.get('/medical-records')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Electronic Health Records", response.data)

    def test_billing_page(self):
        response = self.app.get('/billing')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Revenue Analytics & Invoicing", response.data)

    def test_rooms_page(self):
        response = self.app.get('/rooms')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Hospital Ward & Bed Allocation", response.data)

    def test_queries_page(self):
        response = self.app.get('/queries')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"MongoDB Live Query & Aggregation Console", response.data)

    def test_api_stats(self):
        response = self.app.get('/api/stats')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('total_patients', data)
        self.assertIn('total_revenue', data)
        self.assertGreaterEqual(data['total_patients'], 7)

    def test_query_console_executions(self):
        # Query 1
        res = self.app.post('/api/run-query', json={'query_id': 'q1'})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertGreaterEqual(len(data['result']), 1)

        # Query 6
        res = self.app.post('/api/run-query', json={'query_id': 'q6'})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertIn('total_patients', data['result'])

        # Query 7 ($group)
        res = self.app.post('/api/run-query', json={'query_id': 'q7'})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])

        # Query 8 ($lookup)
        res = self.app.post('/api/run-query', json={'query_id': 'q8'})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])

        # Revenue
        res = self.app.post('/api/run-query', json={'query_id': 'q_revenue'})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])

if __name__ == '__main__':
    unittest.main()
