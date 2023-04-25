import { Sequelize } from 'sequelize';
import env from '../utils/env';

const sequelize = new Sequelize(
  env.MYSQL_DATABASE,
  env.MYSQL_USER,
  env.MYSQL_PASSWORD,
  {
    dialect: 'mysql',
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    logging: false,
  },
);

export default sequelize;
