"use client";
import { useEffect, useState } from "react";

export function UserAppointments({ userId }) {
  const [appointments, setAppointments] = useState([]); // Siempre inicializado como arreglo
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/v1/appointments/user/${userId}`
        );
        if (!response.ok) {
          throw new Error(`Error al obtener las citas: ${response.status}`);
        }
        const data = await response.json();
        console.log("API Response:", data); // Verifica el contenido
        setAppointments(Array.isArray(data) ? data : []); // Asegúrate de que siempre sea un arreglo
      } catch (err) {
        console.error("Error al cargar citas:", err);
        setAppointments([]); // Asegura que el estado sea un arreglo vacío en caso de error
        setError(err.message);
      }
    };

    if (userId) {
      fetchAppointments();
    } else {
      setAppointments([]); // Limpia las citas si no hay usuario
    }
  }, [userId]);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/appointments/${id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error(`Error al eliminar cita: ${response.status}`);
      }

      setAppointments((prev) => prev.filter((appt) => appt.id !== id));
      alert("Cita eliminada.");
    } catch (error) {
      console.error("Error al eliminar cita:", error);
      alert("No se pudo eliminar la cita.");
    }
  };

  if (error) {
    return <div>Error al cargar las citas: {error}</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Mis Citas</h2>
      {Array.isArray(appointments) && appointments.length === 0 ? (
        <p>No tienes citas agendadas.</p>
      ) : (
        <ul>
          {appointments.map((appointment) => (
            <li key={appointment.id} className="border-b py-2">
              <div className="font-medium">
                {new Date(appointment.fecha).toLocaleDateString("es-ES")}
              </div>
              <div className="text-sm text-gray-500">
                Servicio: {appointment.servicioId} - Estado:{" "}
                {appointment.estado}
              </div>
              <button
                onClick={() => handleDelete(appointment.id)}
                className="text-red-500 hover:underline"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
