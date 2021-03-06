const app = require('../../src/app');
const mongoose = require('mongoose');
const request = require('supertest');
const faker = require('faker');
const { getRandomInt, getUserData } = require('../utils/functions');
describe('Users controller', () => {
  // eslint-disable-next-line no-unused-vars
  let userModel;

  beforeAll(async () => {
    const conect = require('../../databaseConfig');
    await conect();
    userModel = mongoose.model('User');
  });

  beforeEach(async () => {
    await userModel.deleteMany();
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should list all users', async () => {
    const count = getRandomInt();
    for (let i = 0; i < count; i++) {
      const userData = getUserData();
      await userModel.create(userData);
    }

    const response = await request(app).get('/users/');

    expect(response.body.error).toBe(undefined);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(count);
  });
  it('should list one user with valid id', async () => {
    const userData = getUserData();

    const user = await userModel.create(userData);

    const response = await request(app).get(`/users/${user._id}`);
    expect(response.body.error).toBe(undefined);
    expect(response.status).toBe(200);
    expect(response.body.username).toBe(userData.username);
    expect(response.body.tools).toStrictEqual([]);
    expect(response.body._id).toBeDefined();
  });

  it('should not list one user without valid id and should return 404', async () => {
    const response = await request(app).get('/users/15151').send();
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not found');
  });

  it('should store and return user with valid fields', async () => {
    const userData = getUserData();
    const response = await request(app).post('/users').send(userData);

    expect(response.body.error).toBe(undefined);
    expect(response.status).toBe(201);
    expect(response.body.username).toBe(userData.username);
    expect(response.body.tools).toStrictEqual([]);
    expect(response.body._id).toBeDefined();
  });

  it('should not store user with invalid fields', async () => {
    const userData = {};
    const response = await request(app).post('/users').send(userData);

    expect(response.status).toBe(400);
  });

  it('should update and return user with valid token and id', async () => {
    const userData = getUserData();
    const updatedUser = getUserData();
    const user = await userModel.create(userData);

    const loginResponse = await request(app).get('/login').send(userData);
    const token = loginResponse.body.token;
    const response = await request(app)
      .put(`/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedUser);
    expect(response.body.error).toBe(undefined);
    expect(response.status).toBe(200);
    expect(response.body.username).toBe(updatedUser.username);
    expect(response.body._id).toBeDefined();
  });

  it('should not update another user', async () => {
    const userToRequestData = getUserData();
    await userModel.create(userToRequestData);
    const userToUpdate = await userModel.create(getUserData());

    const loginResponse = await request(app)
      .get('/login')
      .send(userToRequestData);
    const token = loginResponse.body.token;
    const response = await request(app)
      .put(`/users/${userToUpdate._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(userToUpdate);

    expect(response.body.error).toBe('Unauthorized');
    expect(response.status).toBe(400);
  });

  it('should not update and return user without valid id', async () => {
    const userData = getUserData();
    await userModel.create(userData);

    const loginResponse = await request(app).get('/login').send(userData);
    const token = loginResponse.body.token;
    const response = await request(app)
      .put(`/users/12345`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not found');
  });

  it('should delete user with valid id and token', async () => {
    const userData = getUserData();
    const user = await userModel.create(userData);

    const loginResponse = await request(app).get('/login').send(userData);
    const token = loginResponse.body.token;
    const response = await request(app)
      .delete(`/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(response.body.error).toBe(undefined);
    expect(response.status).toBe(204);
  });

  it('should not delete another user.', async () => {
    const userToRequestData = getUserData();
    await userModel.create(userToRequestData);
    const userToUpdate = await userModel.create(getUserData());

    const loginResponse = await request(app)
      .get('/login')
      .send(userToRequestData);
    const token = loginResponse.body.token;

    const response = await request(app)
      .delete(`/users/${userToUpdate._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(userToUpdate);

    expect(response.body.error).toBe('Unauthorized');
    expect(response.status).toBe(400);
  });

  it('should not delete without valid id', async () => {
    const userData = getUserData();
    await userModel.create(userData);

    const loginResponse = await request(app).get('/login').send(userData);
    const token = loginResponse.body.token;
    const response = await request(app)
      .delete(`/users/12345`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not found');
  });

  /*
    Authentication
  */

  it('should authenticate with valid credentials', async () => {
    const userData = getUserData();
    await userModel.create(userData);
    const response = await request(app).get('/login').send(userData);
    expect(response.body.error).toBe(undefined);
    expect(response.status).toBe(200);
    expect(response.body.token).not.toBeNull();
  });

  it('should not authenticate with invalid credentials', async () => {
    const userData = getUserData();
    await userModel.create(userData);
    const response = await request(app).get('/login').send({
      username: userData.username,
      password: faker.internet.password(),
    });

    expect(response.body.error).toBe('User or password invalid');
    expect(response.status).toBe(400);
    expect(response.body.token).toBe(undefined);
  });

  it('should not authenticate without user', async () => {
    const response = await request(app).get('/login').send();

    expect(response.body.error).toBe('User or password invalid');
    expect(response.status).toBe(400);
    expect(response.body.token).toBe(undefined);
  });
});
