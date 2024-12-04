import lustre/effect
import lustre_sandbox/model.{type Model}

pub type CarouselMsg {
  NextSlide(String)
  PreviousSlide(String)
  GotoSlide(String, Int)
  StartAutoSlide(String, Int)
  PauseAutoSlide(String, Int)
}
pub fn message_handler(model: Model, carouselmsg: CarouselMsg) {
  #(model, effect.none())
}
