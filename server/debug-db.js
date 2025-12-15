import sequelize from './config/database.js';

const check = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected');
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Companies';
        `);
        console.log('Columns:', results.map(r => r.column_name));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
