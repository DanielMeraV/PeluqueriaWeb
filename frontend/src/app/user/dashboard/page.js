'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatProvider } from '../../../context/ChatContext';
import { ChatWindow } from '../../../components/Chat/ChatWindow';
import { UserAppointments } from '../../../components/Citas/UserAppointments';

export default function UserDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [availableHours, setAvailableHours] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedServiceData, setSelectedServiceData] = useState(null); // Nuevo estado

    // Efecto para la hidratación
    useEffect(() => {
        setMounted(true);
    }, []);

    // Efecto para autenticación y carga de datos
    useEffect(() => {
        const initializeUser = async () => {
            try {
                const userData = localStorage.getItem("user");
                if (!userData) {
                    router.push("/login");
                    return;
                }

                const parsedUser = JSON.parse(userData);
                if (parsedUser.rol === "Admin") {
                    router.push("/admin/dashboard");
                    return;
                }

                setUser(parsedUser);

                const response = await fetch("http://localhost:5000/api/v1/services");
                const servicesData = await response.json();
                setServices(servicesData);
            } catch (error) {
                console.error("Error:", error);
                router.push("/login");
            }
        };

        initializeUser();
    }, [router]);

    if (!mounted || !user) {
        return null;
    }


    const handleServiceSelection = async (serviceId) => {
        setSelectedService(serviceId);
        setAvailableHours([]); // Limpia horas disponibles si selecciona otro servicio
        setSelectedDate(""); // Limpia fecha seleccionada
        setSelectedTime(""); // Limpia hora seleccionada
    };

    const handleDateSelection = async (date) => {
        setSelectedDate(date);
        setAvailableHours([]); // Limpia los horarios al cambiar la fecha

        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData || !userData.token) {
                throw new Error('No hay sesión activa');
            }

            const response = await fetch(
                `http://localhost:5000/api/v1/appointments/available/${date}`,
                {
                    headers: {
                        'Authorization': `Bearer ${userData.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Error al obtener horas disponibles");
            }

            const hours = await response.json();
            if (Array.isArray(hours)) {
                setAvailableHours(hours);
            } else {
                console.error("El servidor no devolvió un array:", hours);
                setAvailableHours([]);
            }
        } catch (error) {
            console.error("Error al cargar horas disponibles:", error);
            setAvailableHours([]);
            alert(error.message);
        }
    };

    const handleServiceSelect = (service) => {
        setSelectedService(service.id);
        setSelectedServiceData(service); // Guardamos toda la información del servicio
    };

    const handleReserve = async () => {
        if (!selectedService || !selectedDate || !selectedTime) {
            alert("Por favor selecciona un servicio, una fecha y un horario.");
            return;
        }

        try {
            // Obtener el token del localStorage
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData || !userData.token) {
                throw new Error('No hay sesión activa');
            }

            const response = await fetch("http://localhost:5000/api/v1/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${userData.token}` // Añadir el token aquí
                },
                body: JSON.stringify({
                    usuarioId: user.id,
                    servicioId: selectedService,
                    fecha: `${selectedDate}T${selectedTime}`,
                    estado: "Pendiente",
                }),
            });

            if (response.ok) {
                alert("Cita reservada exitosamente.");
                // Limpiar selecciones
                setSelectedService(null);
                setSelectedServiceData(null);
                setSelectedDate("");
                setSelectedTime("");

                // Opcional: Recargar las citas del usuario
                if (typeof window !== 'undefined') {
                    window.location.reload();
                }
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al reservar la cita');
            }
        } catch (error) {
            console.error("Error al reservar cita:", error);
            alert(error.message || "Error al procesar la reservación.");
        }
    };


    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Panel de Usuario</h1>

                {/* Formulario de reserva */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-semibold mb-4">Reservar Cita</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block mb-2">Fecha:</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded"
                                value={selectedDate}
                                onChange={(e) => handleDateSelection(e.target.value)}
                            />
                        </div>
                        {selectedDate && (
                            <div>
                                <label className="block mb-2">Hora:</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                >
                                    <option value="">Seleccionar horario</option>
                                    {availableHours.map((hour) => (
                                        <option key={hour} value={hour}>
                                            {hour}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {selectedServiceData && (
                            <div className="col-span-full bg-blue-50 p-4 rounded">
                                <h3 className="font-semibold">Servicio seleccionado:</h3>
                                <p>{selectedServiceData.nombre} - ${selectedServiceData.precio}</p>
                                <button
                                    onClick={handleReserve}
                                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Confirmar Reserva
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lista de Servicios */}
                <div className="grid gap-6">
                    <div className="col-span-2 bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Servicios Disponibles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map((service) => (
                                <div
                                    key={service.id}
                                    className={`border p-4 rounded-lg ${selectedService === service.id ? 'border-blue-500' : ''
                                        }`}
                                >
                                    <h3 className="font-bold">{service.nombre}</h3>
                                    <p className="text-gray-600">{service.descripcion}</p>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-gray-500">
                                            ${service.precio} - {service.duracion} min
                                        </span>
                                        <button
                                            onClick={() => handleServiceSelect(service)}
                                            className={`px-4 py-2 rounded ${selectedService === service.id
                                                ? 'bg-green-500 text-white'
                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                                }`}
                                        >
                                            {selectedService === service.id ? 'Seleccionado' : 'Seleccionar'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <ChatProvider userId={user.id}>
                        <ChatWindow isAdmin={false} />
                    </ChatProvider>
                </div>

                <UserAppointments userId={user.id} />
            </div>
        </div>
    );
}