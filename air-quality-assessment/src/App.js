import "./App.css";
import "semantic-ui-css/semantic.min.css";

import {
  Button,
  Divider,
  Dropdown,
  Grid,
  Header,
  Icon,
  Segment,
} from "semantic-ui-react";
import React, { useEffect, useState } from "react";

import axios from "axios";

const fetchUrl = "https://u50g7n0cbj.execute-api.us-east-1.amazonaws.com/v2";

const App = () => {
  const [cityOptions, setCityOptions] = useState([]);
  const [selectedCities, setSelectedCities] = useState({});
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [fetchResults, setFetchResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const asyncCheckSession = async () => {
      await axios
        .get(
          `${fetchUrl}/cities?sort=asc&order_by=city&limit=100000&country=US`
        )
        .then((e) => initCityDropdown(e))
        .catch((err) => setErrorMessage(err));
    };

    asyncCheckSession();
  }, []);

  const initCityDropdown = (serverResponse) => {
    const data = serverResponse?.data?.results;
    setCityOptions(
      data.map((item) => {
        return { key: item.city, value: item.city, text: item.city };
      })
    );
  };

  const handleCompare = async () => {
    //check duplicates and dispaly error if comparing the same city. can be improved by just removing a selected city as an option from other dropdowns
    const selectedCitiesSet = new Set(Object.values(selectedCities));
    if (Object.values(selectedCities).length !== selectedCitiesSet.size) {
      setErrorMessage("Please select cities of different names");
      setFetchResults([]);
      return;
    } else {
      setErrorMessage(null);
    }

    const cityFetchUrl = `${fetchUrl}/measurements?limit=1&country=US&city=`;
    const fetchRequests = Object.keys(selectedCities).map((opt) => {
      return axios.get(`${cityFetchUrl}${selectedCities[opt]}`);
    });
    await axios
      .all(fetchRequests)
      .then((e) => setFetchResults(e.map((resp) => resp?.data?.results)))
      .catch((err) => setErrorMessage(err));
  };

  const resultDisplay = (cityInfo) => (
    <div class="content">
      <h3 class="header">{cityInfo?.city}</h3>
      <div class="meta">
        <span>{`${cityInfo?.value} ${cityInfo?.unit}`}</span>
      </div>
    </div>
  );

  const cityComponent = (cityNumber) => {
    return (
      <Grid.Column>
        <Header icon>
          <Icon name="search" />
          {`Select City ${cityNumber}`}
        </Header>

        <Dropdown
          placeholder="Select City"
          fluid
          key={cityNumber}
          search
          value={selectedCities[cityNumber] ?? ""}
          selection
          options={cityOptions}
          onChange={(e, data) => {
            const newCities = { ...selectedCities, [cityNumber]: data.value };
            setSelectedCities(newCities);
            if (Object.values(newCities).length > 1) setButtonDisabled(false);
          }}
        />
        {fetchResults.length > 0 &&
          resultDisplay(fetchResults[cityNumber - 1][0])}
      </Grid.Column>
    );
  };

  const SegmentExamplePlaceholderGrid = () => (
    <Segment placeholder>
      <Grid columns={2} stackable textAlign="center">
        <Divider vertical>And</Divider>
        <Grid.Row verticalAlign="middle">
          {cityComponent(1)}
          {cityComponent(2)}
        </Grid.Row>
      </Grid>
    </Segment>
  );

  return (
    <div className="App">
      <Header as="h1">Compare Air Assessment Between Two Cities</Header>
      <SegmentExamplePlaceholderGrid />

      <Button primary disabled={buttonDisabled} onClick={handleCompare}>
        Compare
      </Button>
      {errorMessage && (
        <div class="ui negative message transition">
          <i class="close icon" onClick={() => setErrorMessage(null)}></i>
          <div class="header">{errorMessage}</div>
        </div>
      )}
    </div>
  );
};

export default App;
