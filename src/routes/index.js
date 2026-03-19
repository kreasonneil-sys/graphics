
import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Welcome from '../pages/Welcome';
import ParticleBall from '../pages/ParticleBall';

export default function Routes() {
  return (
    <Switch>
      <Route path="/" exact component={ParticleBall} />
      <Route path="/welcome" component={Welcome} />
    </Switch>
  );
}
