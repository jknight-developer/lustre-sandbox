import gleam/dict
import lustre/effect.{type Effect}
import lustre_sandbox/lib/types.{type Model, Model, type State, State}
import lustre_sandbox/lib/msg.{type Msg, type IntMsg}

pub fn message_handler(model: Model, intmsg: IntMsg) -> #(Model, Effect(Msg)) {
  case intmsg {
    msg.IntIncrement(name) -> #(
      Model(
      State(..model.state, ints: dict.map_values(model.state.ints, fn(k: String, v: Int) {case k {
        n if n == name -> v + 1
        _ -> v
      }}))),
      effect.none()
    )
    msg.IntDecrement(name) -> #(
      Model( 
      State(..model.state, ints: dict.map_values(model.state.ints, fn(k: String, v: Int) {case k, v {
        n, i if n == name && i > 0 -> v - 1
        _, _ -> v
      }}))), 
      effect.none()
    )
  }
}

