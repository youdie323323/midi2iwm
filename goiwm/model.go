package main

import (
	"encoding/xml"
	"fmt"
	"math"
	"strconv"
)

type (
	Block         int
	EventListener int
	EventAction   int
)

type UnderlyingField struct {
	Type         Block           `xml:"type,attr"`
	Param        []*Param        `xml:"param,omitempty"`
	Event        []*Event        `xml:"event,omitempty"`
	Obj          []*Slot         `xml:"obj,omitempty"`
	GlobalObject []*GlobalObject `xml:"global_obj,omitempty"`
	SpriteAngle  *int            `xml:"sprite_angle,attr,omitempty"`
	Name         *string         `xml:"name,omitempty"`
}

type XYField struct {
	X int `xml:"x,attr"`
	Y int `xml:"y,attr"`
}

type Object struct {
	XMLName xml.Name `xml:"object"`
	UnderlyingField
	XYField
}

type Slot struct {
	XMLName xml.Name `xml:"obj"`
	UnderlyingField
	XYField
	Number int `xml:"slot,attr"`
}

type GlobalObject struct {
	XMLName xml.Name `xml:"global_obj"`
	UnderlyingField
	SlotDist float64 `xml:"slot_distance,attr"`
	SlotAng  float64 `xml:"slot_angle,attr"`
}

type ParamKey string

type Param struct {
	XMLName xml.Name `xml:"param"`
	Key     ParamKey `xml:"key,attr"`
	Val     any      `xml:"val,attr"`
}

func (p *Param) MarshalXML(e *xml.Encoder, start xml.StartElement) error {
	type Alias Param
	param := &struct {
		*Alias
		Val string `xml:"val,attr"`
	}{
		Alias: (*Alias)(p),
	}

	switch v := p.Val.(type) {
	case float64:
		param.Val = strconv.FormatFloat(math.Round(v*10000)/10000, 'f', -1, 64)
	case int:
		param.Val = strconv.Itoa(v)
	case string:
		param.Val = v
	case bool:
		c := 0
		if v {
			c = 1
		}
		param.Val = strconv.Itoa(c)
	default:
		return fmt.Errorf("unsupported param value type: %T", v)
	}

	return e.EncodeElement(param, start)
}

func (p *Param) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	type Alias Param
	param := &struct {
		*Alias
		Val string `xml:"val,attr"`
	}{
		Alias: (*Alias)(p),
	}
	if err := d.DecodeElement(&param, &start); err != nil {
		return err
	}

	if v, err := strconv.ParseFloat(param.Val, 64); err == nil {
		p.Val = v
	} else {
		p.Val = param.Val
	}
	return nil
}

type Event struct {
	EventID EventListener `xml:"eventIndex,attr"`
	Param   []*Param      `xml:"param"`
	Events  []*EventBody  `xml:"event"`
}

type EventBody struct {
	EventID EventAction `xml:"eventIndex,attr"`
	Param   []*Param    `xml:"param"`
}

// Alright so, i lost original project file, write functions in here

func ToXMLString(s any) (string, error) {
	buf, err := xml.Marshal(s)
	if err != nil {
		return "", err
	}
	return string(buf), nil
}

func NewObject(x int, y int, t Block, p []*Param, n *string, s *int) *Object {
	return &Object{
		UnderlyingField: UnderlyingField{
			Type:         t,
			Param:        p,
			Event:        make([]*Event, 0),
			Obj:          make([]*Slot, 0, 32),
			GlobalObject: make([]*GlobalObject, 0),
			SpriteAngle:  s,
			Name:         n,
		},
		XYField: XYField{
			x,
			y,
		},
	}
}

func ParamByMap[T ~string](m map[T]any) []*Param {
    p := make([]*Param, 0, len(m))
    for k, v := range m {
        p = append(p, &Param{
            Key: ParamKey(k),
            Val: v,
        })
    }
    return p
}

func NewSlot(obj *Object) *Slot {
    slot := &Slot{
        XYField: obj.XYField,
    }
    slot.Type = obj.Type
    slot.Param = append([]*Param{}, obj.Param...)
    slot.Event = append([]*Event{}, obj.Event...)
    slot.Obj = append([]*Slot{}, obj.Obj...)
    slot.GlobalObject = append([]*GlobalObject{}, obj.GlobalObject...)
    slot.SpriteAngle = obj.SpriteAngle
    slot.Name = obj.Name
    return slot
}

func NewGlobalObject(obj *Object) *GlobalObject {
    globalObj := &GlobalObject{}
    globalObj.Type = obj.Type
    globalObj.Param = append([]*Param{}, obj.Param...)
    globalObj.Event = append([]*Event{}, obj.Event...)
    globalObj.Obj = append([]*Slot{}, obj.Obj...)
    globalObj.GlobalObject = append([]*GlobalObject{}, obj.GlobalObject...)
    globalObj.SpriteAngle = obj.SpriteAngle
    globalObj.Name = obj.Name
    return globalObj
}