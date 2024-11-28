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

    static associate(models) {
        // Asociación con Usuario
        this.belongsTo(models.User, {
            as: 'usuario',
            foreignKey: 'usuarioId'
        });

        // Asociación con Servicio
        this.belongsTo(models.Service, {
            as: 'servicio',
            foreignKey: 'servicioId'
        });
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
        allowNull: false,
        validate: {
            isDate: true,
            isFuture(value) {
                if (value < new Date()) {
                    throw new Error('La fecha de la cita debe ser futura');
                }
            }
        }
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pendiente',
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