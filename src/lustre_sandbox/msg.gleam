pub type Msg {
  OnRouteChange(Route)
  StateReset
  InputUpdate(String, String)
  IntMessage(IntMsg)
  CarouselMessage(CarouselMsg)
}

pub type Route {
  Index
  About
}

pub type CarouselMsg {
  NextSlide(String)
  PreviousSlide(String)
  GotoSlide(String, Int)
  StartAutoSlide(String, Int)
  PauseAutoSlide(String, Int)
}

pub type IntMsg {
  IntIncrement(String)
  IntDecrement(String)
}

