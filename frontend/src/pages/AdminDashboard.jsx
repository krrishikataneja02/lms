import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../utils/api';
import { Users, Award, BookOpen, TrendingUp, BarChart2, PieChart } from 'lucide-react';
import Chart from 'chart.js/auto';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalCourses: 0,
    avgEnrollment: '0'
  });
  const [activityUsers, setActivityUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const densityCanvasRef = useRef(null);
  const ratioCanvasRef = useRef(null);
  
  const densityChartRef = useRef(null);
  const ratioChartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await apiCall('/auth/users');
        const courses = await apiCall('/courses');

        const students = users.filter(u => u.role === 'student');
        const faculty = users.filter(u => u.role === 'faculty');
        const admins = users.filter(u => u.role === 'admin');

        const totalStudents = students.length;
        const totalFaculty = faculty.length;
        const totalCourses = courses.length;
        const totalEnrollments = courses.reduce((acc, c) => acc + c.studentsEnrolled.length, 0);
        const avgEnrollment = totalCourses ? (totalEnrollments / totalCourses).toFixed(1) : '0';

        setStats({
          totalStudents,
          totalFaculty,
          totalCourses,
          avgEnrollment
        });
        setActivityUsers(users.slice(-4).reverse());
        setLoading(false);

        // Draw Charts
        setTimeout(() => {
          drawCharts(courses, totalStudents, totalFaculty, admins.length);
        }, 50);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup charts on unmount
    return () => {
      if (densityChartRef.current) densityChartRef.current.destroy();
      if (ratioChartRef.current) ratioChartRef.current.destroy();
    };
  }, []);

  const drawCharts = (courses, studentsCount, facultyCount, adminCount) => {
    if (densityChartRef.current) densityChartRef.current.destroy();
    if (ratioChartRef.current) ratioChartRef.current.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textLabelColor = isDark ? '#94a3b8' : '#475569';
    const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    if (densityCanvasRef.current) {
      densityChartRef.current = new Chart(densityCanvasRef.current, {
        type: 'bar',
        data: {
          labels: courses.map(c => c.code),
          datasets: [{
            label: 'Students Enrolled',
            data: courses.map(c => c.studentsEnrolled.length),
            backgroundColor: 'rgba(99, 102, 241, 0.75)',
            borderColor: '#6366f1',
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { color: gridLineColor },
              ticks: { color: textLabelColor }
            },
            y: {
              grid: { color: gridLineColor },
              ticks: { color: textLabelColor, stepSize: 1 }
            }
          }
        }
      });
    }

    if (ratioCanvasRef.current) {
      ratioChartRef.current = new Chart(ratioCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Students', 'Faculty', 'Admins'],
          datasets: [{
            data: [studentsCount, facultyCount, adminCount],
            backgroundColor: [
              'rgba(20, 184, 166, 0.75)',
              'rgba(245, 158, 11, 0.75)',
              'rgba(239, 68, 68, 0.75)'
            ],
            borderColor: isDark ? '#0f172a' : '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textLabelColor, boxWidth: 12 }
            }
          }
        }
      });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Dashboard Analytics...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="dashboard-grid">
        <div className="glass-panel stats-card primary">
          <div className="stats-info">
            <h3>Total Enrolled Students</h3>
            <p>{stats.totalStudents}</p>
          </div>
          <div className="stats-icon-wrapper">
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
        <div className="glass-panel stats-card secondary">
          <div className="stats-info">
            <h3>Academic Faculty</h3>
            <p>{stats.totalFaculty}</p>
          </div>
          <div className="stats-icon-wrapper">
            <Award style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
        <div className="glass-panel stats-card accent">
          <div className="stats-info">
            <h3>Active Courses</h3>
            <p>{stats.totalCourses}</p>
          </div>
          <div className="stats-icon-wrapper">
            <BookOpen style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
        <div className="glass-panel stats-card warning">
          <div className="stats-info">
            <h3>Avg Enrollment Rate</h3>
            <p>{stats.avgEnrollment} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ course</span></p>
          </div>
          <div className="stats-icon-wrapper">
            <TrendingUp style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="glass-panel">
          <div className="panel-header">
            <h3>Course Enrollment Density</h3>
            <BarChart2 style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="panel-content" style={{ height: '280px', position: 'relative' }}>
            <canvas ref={densityCanvasRef}></canvas>
          </div>
        </div>
        <div className="glass-panel">
          <div className="panel-header">
            <h3>Account Role Split</h3>
            <PieChart style={{ color: 'var(--color-secondary)' }} />
          </div>
          <div className="panel-content" style={{ height: '280px', position: 'relative' }}>
            <canvas ref={ratioCanvasRef}></canvas>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-header">
          <h3>Platform Activity Log</h3>
          <span className="badge badge-success">System Online</span>
        </div>
        <div className="panel-content" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Resource Name</th>
                  <th>Entity Type</th>
                  <th>Email Identifier</th>
                  <th>System Status</th>
                </tr>
              </thead>
              <tbody>
                {activityUsers.map((u, i) => (
                  <tr key={i}>
                    <td><strong>{u.name}</strong></td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'faculty' ? 'badge-warning' : 'badge-primary'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-success">active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
