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
  const [parameterOptions, setParameterOptions] = useState([]);
  const [chosenParameter, setChosenParameter] = useState("");

  useEffect(() => {
    const asyncCheckSession = async () => {
      await axios
        .get(
          `${fetchUrl}/cities?sort=asc&order_by=city&limit=100000&country=US`
        )
        .then((e) => initCityDropdown(e))
        .catch((err) => setErrorMessage(err));

      await axios
        .get(`${fetchUrl}/parameters?limit=100&sort=asc`)
        .then((e) => initParameterOptions(e))
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

  const initParameterOptions = (serverResponse) => {
    const data = serverResponse?.data?.results;
    const uniqueElements = {};
    data.forEach((item) => {
      if (!uniqueElements[item.name]) {
        uniqueElements[item.name] = item.displayName;
      }
    });
    setParameterOptions(
      Object.keys(uniqueElements).map((item) => {
        return { key: item, value: item, text: uniqueElements[item] };
      })
    );
  };

  const handleCompare = async () => {
    //check duplicates and dispaly error if comparing the same city. can be improved by just removing a selected city as an option from other dropdowns
    setFetchResults([]);
    const selectedCitiesSet = new Set(Object.values(selectedCities));
    if (Object.values(selectedCities).length !== selectedCitiesSet.size) {
      setErrorMessage("Please select cities of different names");
      return;
    } else {
      setErrorMessage(null);
    }

    const cityFetchUrl = `${fetchUrl}/measurements?limit=1&country=US&parameter=${chosenParameter}&city=`;
    const fetchRequests = Object.keys(selectedCities).map((opt) => {
      return axios.get(`${cityFetchUrl}${selectedCities[opt]}`);
    });
    await axios
      .all(fetchRequests)
      .then((e) => {
        //axios all maintains order of requests in response body
        const result = [];
        e.forEach((resp, index) => {
          if (resp?.data?.results?.length < 1) {
            setErrorMessage(
              `City ${
                index + 1
              } does not have data for parameter ${chosenParameter}. Please select another parameter or city for comparison.`
            );
          } else {
            result.push(resp.data.results);
          }
        });
        if (result.length === e.length) {
          setFetchResults(result);
        }
      })
      .catch((err) => setErrorMessage(err));
  };

  const resultDisplay = (cityInfo) => (
    <div className="content">
      <h3 className="header">{cityInfo?.city}</h3>
      <div className="meta">
        <span>{`${cityInfo?.value} ${cityInfo?.unit} (parameter: ${cityInfo?.parameter})`}</span>
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
            if (Object.values(newCities).length > 1 && chosenParameter !== "") {
              setButtonDisabled(false);
            }
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
      <Dropdown
        placeholder="Select Parameter for Comparison"
        fluid
        selection
        options={parameterOptions}
        onChange={(e, data) => {
          if (Object.values(selectedCities).length > 1) {
            setButtonDisabled(false);
          }
          setChosenParameter(data.value);
        }}
      />
      <SegmentExamplePlaceholderGrid />

      <Button primary disabled={buttonDisabled} onClick={handleCompare}>
        Compare
      </Button>
      {errorMessage && (
        <div className="ui negative message transition">
          <i className="close icon" onClick={() => setErrorMessage(null)}></i>
          <div className="header">{errorMessage}</div>
        </div>
      )}
    </div>
  );
};

export default App;
