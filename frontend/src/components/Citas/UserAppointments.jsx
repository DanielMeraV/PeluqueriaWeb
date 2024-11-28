"use client";
import { useEffect, useState } from "react";

export function UserAppointments({ userId }) {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userData?.token}`,
    };
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/v1/appointments/user/${userId}`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Error al obtener las citas: ${response.status}`
          );
        }

        const data = await response.json();
        console.log("Citas recibidas:", data);

        // Asegurarse de que los datos incluyen la información del servicio
        const appointmentsWithServices = Array.isArray(data)
          ? data.map((appointment) => ({
              ...appointment,
              servicio: appointment.servicio || {
                nombre: "Servicio no disponible",
              },
            }))
          : [];

        setAppointments(appointmentsWithServices);
      } catch (err) {
        console.error("Error al cargar citas:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAppointments();
    } else {
      setAppointments([]);
      setLoading(false);
    }
  }, [userId]);

  const handleDelete = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData || !userData.token) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(
        `http://localhost:5000/api/v1/appointments/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userData.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar la cita");
      }

      setAppointments((prev) => prev.filter((appt) => appt.id !== id));
      alert("Cita eliminada exitosamente.");
    } catch (error) {
      console.error("Error al eliminar cita:", error);
      alert(error.message || "No se pudo eliminar la cita.");
    }
  };
  
  if (loading) {
    return <div className="text-center py-4">Cargando citas...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Mis Citas</h2>
      {appointments.length === 0 ? (
        <p className="text-gray-500">No tienes citas agendadas.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">
                    {new Date(appointment.fecha).toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Servicio:{" "}
                    {appointment.servicio?.nombre || "No especificado"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Estado:{" "}
                    <span
                      className={`font-medium ${
                        appointment.estado === "Confirmada"
                          ? "text-green-600"
                          : appointment.estado === "Pendiente"
                          ? "text-yellow-600"
                          : appointment.estado === "Cancelada"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {appointment.estado}
                    </span>
                  </div>
                </div>
                {appointment.estado !== "Completada" && (
                  <button
                    onClick={() => handleDelete(appointment.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
