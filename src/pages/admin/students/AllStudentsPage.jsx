import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Table, Alert, Form } from "react-bootstrap";
import PageHeader from "../../../components/admin/PageHeader";
import { getAllStudents } from "../../../services/studentService";
import { TableSkeleton } from "../../../components/Skeleton";

const AllStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const data = await getAllStudents();
        setStudents(data);
      } catch (err) {
        setError("Failed to load students.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="All Students" />
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <PageHeader title="All Students" />
      <div className="content-card">
        <div className="p-3 border-bottom">
          <Form.Control
            type="text"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Table responsive className="modern-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Grade Level</th>
              <th>Parent(s)</th>
              <th>Enrollment Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td>
                  <Link
                    to={`/admin/students/${student.id}`}
                    className="fw-bold"
                  >
                    {student.last_name}, {student.first_name}
                  </Link>
                </td>
                <td>{student.grade_level}</td>
                <td>{student.parent_names.join(", ")}</td>
                <td>
                  {student.enrollment_date
                    ? new Date(student.enrollment_date).toLocaleDateString()
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default AllStudentsPage;
