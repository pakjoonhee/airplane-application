import React, {Component} from 'react'

class AirplaneSearchResults extends Component {
  state = {
    promises: []
    }

    flightDetails = []
    airlineCodeResponse = []
    token = 'T1RLAQIYHuJNjxknUrqtOEdYFITyWEdfFhDK22ueA0nP6SVcwNYNOgeXAADA/n1G+MjxSC3JcxQnWEzqIGk90u2I638SqSp/5D0d9otZjdtn16/KAFXJcOHmiYck46D0h2kj05wEK9SyyJZjAZ5Qn6F+i+xtAnr6CCg5or3OvHPX3YJTBJiCmV30dhnqPuqR2Fgx3+mHQiU8wGOIGpJPByRWKSNdNbqqx0PH+qNq3Oo2LGl0Cf8H/TqQcOOcDLoz8gqIaruLB02wnS/lTStsidO4m5c6Ve7mDEvQwaxQAUi/c+MVywSK5EkwSOYj';
    headers = { 'Authorization': 'Bearer ' + this.token }
    

    secondCall = (code) => { 
    return axios.get('https://api-crt.cert.havail.sabre.com/v1/lists/utilities/airlines?airlinecode=' + code, {
            headers: this.headers
        }).then(response => {return response})
            .catch(error => alert(error))   
    }
  
    componentDidMount() {
    axios.get('https://api-crt.cert.havail.sabre.com/v1/shop/flights?origin=JFK&destination=ICN&departuredate=2018-10-07&returndate=2018-10-09&onlineitinerariesonly=N&limit=30&offset=1&eticketsonly=N&sortby=totalfare&order=asc&sortby2=departuretime&order2=asc&pointofsalecountry=US', {
        headers: this.headers
    }).then((response) => {
        const jsonData = response.data.PricedItineraries
        const promises = jsonData.map((levelOne) => {
            const firstPromise = levelOne.AirItinerary.OriginDestinationOptions.OriginDestinationOption.map((levelTwo) => { 
            const secondPromise = levelTwo.FlightSegment.map((levelThree) => {
                const hasNoKey = this.secondCall(levelThree.MarketingAirline.Code)
                const axiosCall = (methodCall) => {
                return methodCall
                .then((response) => {
                    return {
                    airlineName: response.data.AirlineInfo,
                    flightDetails: levelThree,
                    totalFlightTime: levelTwo.ElapsedTime,
                    totalFareTotals: levelOne.AirItineraryPricingInfo.ItinTotalFare
                    }
                })
                }

                if(this.airlineCodeResponse.length === 0) {
                this.airlineCodeResponse.push({[levelThree.MarketingAirline.Code]:this.secondCall(levelThree.MarketingAirline.Code)})
                axiosCall(hasNoKey)

                } else if(!this.airlineCodeResponse[0].hasOwnProperty(levelThree.MarketingAirline.Code)) {
                this.airlineCodeResponse[0][levelThree.MarketingAirline.Code] = this.secondCall(levelThree.MarketingAirline.Code)
                axiosCall(hasNoKey)
                }
                
                let keys = Object.keys(this.airlineCodeResponse[0])
                for(let j=0; j<keys.length; j++) {
                if(levelThree.MarketingAirline.Code === keys[j]) {
                    return this.airlineCodeResponse[0][levelThree.MarketingAirline.Code]
                    .then((response) => {
                    return {
                        airlineName: response.data.AirlineInfo,
                        flightDetails: levelThree,
                        totalFlightTime: levelTwo.ElapsedTime,
                        totalFareTotals: levelOne.AirItineraryPricingInfo.ItinTotalFare
                    }
                    })
                }
                }
                // return this.secondCall(levelThree.MarketingAirline.Code)
            })
            return Promise.all(secondPromise)
            })
            return Promise.all(firstPromise)
        })
        return Promise.all(promises)
        }).then((airplaneData) => {
        this.setState({promises: airplaneData})
        }).catch((error) => {
        console.log(error)
        })
    }

    calculateHours = (minutes) => {
    let hours = (minutes / 60)
    let mins = (minutes % 60)
    return Math.round(hours) + " Hours " + mins + " Mins";
    }

    popArray = (array) => {
    let cities = "";
    for(let i=0; i<array.length - 1; i++) {
        cities += array[i].arrivalAirport + " "
    }
    return cities;
    }

    countFlightSegment = (num) => {
    if(num === 1) {
        return "nonstop"
    } else {
        if(num - 1 === 1) {
        return 1 + " Stop"
        } else {
        return (num - 1) + " Stops"
        }
    }
    }

    isMultiCarrier = (airlineNames) => {
    for(let i=1; i<airlineNames.length; i++) {
        if(airlineNames[i].airlineName !== airlineNames[i-1].airlineName) {
        return "Multiple Airlines"
        }
    }
    return airlineNames[0].airlineName;
    }

    pushFlightDetails = (departureDateTime, arrivalDateTime, 
    airlineName, departureAirport, arrivalAirport) => {
        this.flightDetails.push({departureDateTime:departureDateTime, arrivalDateTime:arrivalDateTime,
        airlineName:airlineName, departureAirport:departureAirport, arrivalAirport:arrivalAirport})
    }

  render() {
    let details = this.state.promises
    const airlineDetails = details.map((levelOne) => {

      return (
        <div className="container">
          {
            levelOne.map((levelTwo) => {
              // console.log(levelTwo)
              return (
                <div>
                  {
                    levelTwo.map((levelThree) => {
                      return (
                        <div>
                          {
                            this.pushFlightDetails(
                              levelThree.flightDetails.DepartureDateTime.split("T").pop(),
                              levelThree.flightDetails.ArrivalDateTime.split("T").pop(),
                              levelThree.airlineName[0].AirlineName,
                              levelThree.flightDetails.DepartureAirport.LocationCode,
                              levelThree.flightDetails.ArrivalAirport.LocationCode )
                          }
                        </div>
                        
                      )
                    })
                  }
                  <div className="left">
                    <div>{this.flightDetails[0].departureDateTime + "-" + this.flightDetails.slice(-1).pop().arrivalDateTime}</div>
                    <div>{this.isMultiCarrier(this.flightDetails)}</div>
                  </div>
                  <div className="left">
                    <div>{this.countFlightSegment(levelTwo.length) + " "} </div>
                    <div>{this.popArray(this.flightDetails)}</div>
                  </div>
                  <div className="left">
                    <div>{this.calculateHours(levelTwo[0].totalFlightTime)}</div>
                    <div>{this.flightDetails[0].departureAirport + "-" + this.flightDetails.slice(-1).pop().arrivalAirport}</div>
                  </div>

                  {this.flightDetails.length = []}
                </div>
              )
            })
          }
        </div>
      )
    })

      return (
        <div>
          {airlineDetails}
        </div>
      )
  }
}

export default AirplaneSearchResults