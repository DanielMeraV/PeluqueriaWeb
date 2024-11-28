'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminChat } from '../../../components/Chat/AdminChat';
import { ChatProvider } from '../../../context/ChatContext';
import { EditAppointmentModal } from "../../../components/Citas/EditAppointmentModal"
export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null); // Movido arriba

    const [mounted, setMounted] = useState(false);
    const [services, setServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [newService, setNewService] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        duracion: '',
        estado: true
    });
    const [editingService, setEditingService] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Efecto para cargar datos (combinado con autenticación)
    useEffect(() => {
        const initializeAdmin = async () => {
            try {
                const userData = localStorage.getItem('user');
                if (!userData) {
                    router.push('/login');
                    return;
                }

                const parsedUser = JSON.parse(userData);
                if (parsedUser.rol !== 'Admin') {
                    router.push('/user/dashboard');
                    return;
                }

                setUser(parsedUser);

                // Cargar datos solo si es admin
                const [servicesResponse, usersResponse] = await Promise.all([
                    fetch('http://localhost:5000/api/v1/services'),
                    fetch('http://localhost:5000/api/v1/users')
                ]);

                if (!servicesResponse.ok || !usersResponse.ok) {
                    throw new Error('Error al cargar los datos');
                }

                const [servicesData, usersData] = await Promise.all([
                    servicesResponse.json(),
                    usersResponse.json()
                ]);

                setServices(servicesData);
                setUsers(usersData);
            } catch (err) {
                setError('Error al cargar los datos: ' + err.message);
                console.error(err);
                router.push('/login');
            }
        };

        initializeAdmin();
    }, [router]); // Solo depende del router

    // Todas las funciones de manejo
    const createService = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/v1/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newService),
            });

            if (!response.ok) {
                throw new Error('No se pudo crear el servicio.');
            }

            const createdService = await response.json();
            setServices([...services, createdService.data]);
            setNewService({ nombre: '', descripcion: '', precio: '', duracion: '', estado: true });
            setSuccess('Servicio creado exitosamente.');
        } catch (err) {
            setError(err.message);
        }
    };

    // Actualizar servicio
    const updateService = async (serviceId) => {
        try {
            const serviceToUpdate = services.find(s => s.id === serviceId);
            const response = await fetch(`http://localhost:5000/api/v1/services/${serviceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serviceToUpdate),
            });

            if (!response.ok) {
                throw new Error('No se pudo actualizar el servicio.');
            }

            setSuccess('Servicio actualizado exitosamente.');
            setEditingService(null);
        } catch (err) {
            setError(err.message);
        }
    };

    // Eliminar servicio
    const deleteService = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/v1/services/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('No se pudo eliminar el servicio.');
            }

            setServices(services.filter((service) => service.id !== id));
            setSuccess('Servicio eliminado exitosamente.');
        } catch (err) {
            setError(err.message);
        }
    };

    // Modificar rol de usuario
    const updateUserRole = async (userId, newRole) => {
        try {
            const response = await fetch(`http://localhost:5000/api/v1/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rol: newRole }),
            });

            if (!response.ok) {
                throw new Error('No se pudo actualizar el rol.');
            }

            const updatedUsers = users.map(user =>
                user.id === userId ? { ...user, rol: newRole } : user
            );

            setUsers(updatedUsers);
            setSuccess('Rol de usuario actualizado exitosamente.');
            setEditingUser(null);
        } catch (err) {
            setError(err.message);
            console.error('Error updating user role:', err);
        }
    };

    if (!mounted || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Panel de Administración</h1>

                {/* Mensajes de Error y Éxito */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        {success}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Gestión de Servicios */}
                    <div className="bg-white shadow-md rounded-xl p-6">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Gestión de Servicios</h2>

                        {/* Formulario de Crear Servicio */}
                        <form onSubmit={createService} className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Nombre del Servicio"
                                    value={newService.nombre}
                                    onChange={(e) => setNewService({ ...newService, nombre: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Precio"
                                    value={newService.precio}
                                    onChange={(e) => setNewService({ ...newService, precio: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                                    required
                                />
                                <textarea
                                    placeholder="Descripción"
                                    value={newService.descripcion}
                                    onChange={(e) => setNewService({ ...newService, descripcion: e.target.value })}
                                    className="col-span-2 w-full p-2 border border-gray-300 rounded-md text-gray-700"
                                />
                                <input
                                    type="number"
                                    placeholder="Duración (minutos)"
                                    value={newService.duracion}
                                    onChange={(e) => setNewService({ ...newService, duracion: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                                    required
                                />
                                <select
                                    value={newService.estado}
                                    onChange={(e) => setNewService({ ...newService, estado: e.target.value === 'true' })}
                                    className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                                >
                                    <option value="true">Activo</option>
                                    <option value="false">Inactivo</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Crear Servicio
                            </button>
                        </form>

                        {/* Lista de Servicios */}
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">Servicios Existentes</h3>
                            {services.length === 0 ? (
                                <p className="text-gray-600">No hay servicios disponibles</p>
                            ) : (
                                services.map((service) => (
                                    <div
                                        key={service.id}
                                        className="flex justify-between items-center bg-gray-50 p-3 rounded-md mb-2"
                                    >
                                        {editingService === service.id ? (
                                            <div className="grid grid-cols-2 gap-3 w-full">
                                                <div className="col-span-2 grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre"
                                                        value={service.nombre}
                                                        onChange={(e) => {
                                                            const updatedServices = services.map(s =>
                                                                s.id === service.id ? { ...s, nombre: e.target.value } : s
                                                            );
                                                            setServices(updatedServices);
                                                        }}
                                                        className="p-2 border border-gray-300 rounded-md text-gray-700"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Precio"
                                                        value={service.precio}
                                                        onChange={(e) => {
                                                            const updatedServices = services.map(s =>
                                                                s.id === service.id ? { ...s, precio: e.target.value } : s
                                                            );
                                                            setServices(updatedServices);
                                                        }}
                                                        className="p-2 border border-gray-300 rounded-md text-gray-700"
                                                    />
                                                </div>

                                                <textarea
                                                    placeholder="Descripción"
                                                    value={service.descripcion}
                                                    onChange={(e) => {
                                                        const updatedServices = services.map(s =>
                                                            s.id === service.id ? { ...s, descripcion: e.target.value } : s
                                                        );
                                                        setServices(updatedServices);
                                                    }}
                                                    className="col-span-2 p-2 border border-gray-300 rounded-md text-gray-700 h-24"
                                                />

                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Duración (minutos)"
                                                        value={service.duracion}
                                                        onChange={(e) => {
                                                            const updatedServices = services.map(s =>
                                                                s.id === service.id ? { ...s, duracion: e.target.value } : s
                                                            );
                                                            setServices(updatedServices);
                                                        }}
                                                        className="p-2 border border-gray-300 rounded-md text-gray-700"
                                                    />
                                                    <select
                                                        value={service.estado}
                                                        onChange={(e) => {
                                                            const updatedServices = services.map(s =>
                                                                s.id === service.id ? { ...s, estado: e.target.value === 'true' } : s
                                                            );
                                                            setServices(updatedServices);
                                                        }}
                                                        className="p-2 border border-gray-300 rounded-md text-gray-700"
                                                    >
                                                        <option value="true">Activo</option>
                                                        <option value="false">Inactivo</option>
                                                    </select>
                                                </div>

                                                <div className="col-span-2 flex justify-between">
                                                    <button
                                                        onClick={() => updateService(service.id)}
                                                        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 w-full mr-2"
                                                    >
                                                        Guardar Cambios
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingService(null)}
                                                        className="bg-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-400 w-full"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <span className="font-semibold text-gray-800">{service.nombre}</span>
                                                    <span className="text-gray-600 ml-2">${service.precio}</span>
                                                </div>
                                                <div>
                                                    <button
                                                        onClick={() => setEditingService(service.id)}
                                                        className="mr-2 text-blue-600 hover:text-blue-800"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => deleteService(service.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Gestión de Usuarios */}
                    <div className="bg-white shadow-md rounded-xl p-6 w-full">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Gestión de Usuarios</h2>
                        <div className="space-y-2">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex justify-between items-center bg-gray-50 p-3 rounded-md"
                                >
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center">
                                            <span className="font-semibold text-gray-800 truncate mr-2">{user.nombre}</span>
                                            <span className="text-gray-600 truncate">{user.email}</span>
                                        </div>

                                        {editingUser === user.id ? (
                                            <div className="flex items-center mt-2">
                                                <select
                                                    value={user.rol}
                                                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                                                    className="p-1 border border-gray-300 rounded-md mr-2 text-gray-700"
                                                >
                                                    <option value="Admin">Admin</option>
                                                    <option value="Cliente">Cliente</option>
                                                </select>
                                                <button
                                                    onClick={() => setEditingUser(null)}
                                                    className="text-gray-600 hover:text-gray-800"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mt-1">
                                                <span
                                                    className={`
                            px-2 py-1 rounded-full text-sm font-medium 
                            ${user.rol === 'Admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                          `}
                                                >
                                                    {user.rol}
                                                </span>
                                                <button
                                                    onClick={() => setEditingUser(user.id)}
                                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                                >
                                                    Editar Rol
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Gestión de Citas */}
                    <AppointmentManager />


                    {/* Chat en la tercera columna */}
                    <div className="col-span-1">
                        <ChatProvider userId={`admin_${user?.id}`} isAdmin={true}>
                            <AdminChat />
                        </ChatProvider>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AppointmentManager() {
    const [appointments, setAppointments] = useState([]); // Inicializado como arreglo vacío
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchAppointments();
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/v1/services");
            const data = await response.json();
            setServices(data);
        } catch (error) {
            console.error("Error al cargar servicios:", error);
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/v1/appointments");
            const data = await response.json();
            console.log("Fetched appointments:", data);
            setAppointments(Array.isArray(data) ? data : []); // Aseguramos que sea un arreglo
        } catch (error) {
            console.error("Error al cargar citas:", error);
            setAppointments([]); // Si ocurre un error, aseguramos que sea un arreglo vacío
        } finally {
            setLoading(false);
        }
    };

    const handleEditAppointment = async (appointmentData) => {
        try {
            const response = await fetch(`http://localhost:5000/api/v1/appointments/${appointmentData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(appointmentData),
            });

            if (response.ok) {
                setShowEditModal(false);
                fetchAppointments();
            } else {
                throw new Error("Error al actualizar la cita");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error al actualizar la cita");
        }
    };

    const handleDeleteAppointment = async (id) => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta cita?")) return;

        try {
            const response = await fetch(`http://localhost:5000/api/v1/appointments/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                fetchAppointments();
            } else {
                throw new Error("Error al eliminar la cita");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error al eliminar la cita");
        }
    };

    const updateAppointmentStatus = async (appointmentId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:5000/api/v1/appointments/${appointmentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: newStatus }),
            });
            if (response.ok) {
                fetchAppointments(); // Recargar citas
            }
        } catch (error) {
            console.error("Error al actualizar cita:", error);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Gestión de Citas</h2>
            {loading ? (
                <p>Cargando citas...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Cliente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Servicio
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(appointments) && appointments.length > 0 ? (
                                appointments.map((appointment) => (
                                    <tr key={appointment.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {appointment.usuario?.nombre || "Desconocido"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {appointment.servicio?.nombre || "Desconocido"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(appointment.fecha).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={appointment.estado}
                                                onChange={(e) =>
                                                    updateAppointmentStatus(
                                                        appointment.id,
                                                        e.target.value
                                                    )
                                                }
                                                className="rounded border p-1"
                                            >
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="Confirmada">Confirmada</option>
                                                <option value="Completada">Completada</option>
                                                <option value="Cancelada">Cancelada</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleEditAppointment(appointment)}
                                                className="text-blue-600 hover:text-blue-900 mr-2"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAppointment(appointment.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="text-center py-4 text-gray-500"
                                    >
                                        No hay citas registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <EditAppointmentModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                appointment={editingAppointment}
                services={services}
                onSave={handleEditAppointment}
            />
        </div>
    );
}
