////////////////////////////////////////////////////////////////////////////
//
// Copyright 2020 Realm Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";

import { App, Credentials, User, getEnvironment } from "realm-web";

import { createApp } from "./utils";

const environment = getEnvironment();

describe("App#constructor", () => {
  afterEach(() => {
    environment.defaultStorage.clear();
  });

  it("constructs", () => {
    const app = new App("default-app-id");
    expect(app).to.be.instanceOf(App);
  });

  it("construct singletons", () => {
    const app1 = App.getApp("default-app-id");
    const app2 = App.getApp("default-app-id");
    expect(app1).to.be.instanceOf(App);
    expect(app1).equals(app2);
    // Assume that the current user's type match the exported User type
    const user: User | null = app1.currentUser;
    expect(user).equals(null);
  });

  it("can login a user", async () => {
    const app = createApp();
    const credentials = Credentials.anonymous();
    const user = await app.logIn(credentials);
    expect(typeof user.id).equals("string");
    expect(app.currentUser).equals(user);
    expect(app.allUsers).deep.equals({ [user.id]: user });
  });

  it("can log in two users, switch between them and log out", async () => {
    const app = createApp();
    const credentials = Credentials.anonymous(false);
    // Authenticate the first user
    const user1 = await app.logIn(credentials);
    expect(app.currentUser).equals(user1);
    expect(app.allUsers).deep.equals({ [user1.id]: user1 });
    // Authenticate the second user
    const user2 = await app.logIn(credentials);
    expect(app.currentUser).equals(user2);
    expect(app.allUsers).deep.equals({
      [user1.id]: user1,
      [user2.id]: user2,
    });
    // Ensure that the two users are not one and the same
    expect(user1.id).to.not.equals(user2.id);
    // Switch back to the first user
    app.switchUser(user1);
    expect(app.currentUser).equals(user1);
    expect(app.allUsers).deep.equals({
      [user1.id]: user1,
      [user2.id]: user2,
    });
    // Switch back to the second user
    app.switchUser(user2);
    expect(app.currentUser).equals(user2);
    expect(app.allUsers).deep.equals({
      [user1.id]: user1,
      [user2.id]: user2,
    });
    // Switch back to the first user and log out
    app.switchUser(user1);
    expect(app.currentUser).equals(user1);
    await user1.logOut();
    expect(app.currentUser).equals(user2);
    expect(app.allUsers).deep.equals({
      [user1.id]: user1,
      [user2.id]: user2,
    });
    await app.removeUser(user1);
    expect(app.allUsers).deep.equals({
      [user2.id]: user2,
    });
  });

  it("restores a user", async () => {
    let user: User<unknown>;
    {
      const app = createApp();
      expect(app.allUsers).deep.equals({});
      const credentials = Credentials.anonymous();
      user = await app.logIn(credentials);
      expect(typeof user.id).equals("string");
    }
    // Recreate the app and expect the user to be restored
    {
      const app = createApp();
      expect(Object.keys(app.allUsers).length).equals(1);
      expect(app.currentUser).instanceOf(User);
      expect(app.currentUser?.id).equals(user.id);
      expect(app.currentUser?.profile).deep.equals(user.profile);
      expect(app.currentUser?.accessToken).equals(user.accessToken);
      expect(app.currentUser?.refreshToken).deep.equals(user.refreshToken);
    }
  });
});
