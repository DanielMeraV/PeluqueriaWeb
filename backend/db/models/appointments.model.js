// models/appointments.model.js
const { Model, DataTypes } = require('sequelize');

class Appointment extends Model {
    static config(sequelize) {
        return {
            sequelize,
            tableName: 'appointments',
            modelName: 'Appointment',
            timestamps: false
        };
    }
}

const AppointmentSchema = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['Pendiente', 'Confirmada', 'Completada', 'Cancelada']]
        }
    },
    usuarioId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    servicioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'servicios',
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
};

module.exports = { Appointment, AppointmentSchema };
