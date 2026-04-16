package main

import (
	"encoding/xml"
	"fmt"
	"math"
	"slices"
	"strconv"
)

type (
	Block         int
	EventListener int
	EventAction   int
)

type UnderlyingField struct {
	Type          Block           `xml:"type,attr"`
	Parameters    []*Parameter    `xml:"param,omitempty"`
	Event         []*Event        `xml:"event,omitempty"`
	Slots         []*Slot         `xml:"obj,omitempty"`
	GlobalObjects []*GlobalObject `xml:"global_obj,omitempty"`
	SpriteAngle   *int            `xml:"sprite_angle,attr,omitempty"`
	Name          *string         `xml:"name,omitempty"`
}

type Position struct {
	X int `xml:"x,attr"`
	Y int `xml:"y,attr"`
}

type Object struct {
	XMLName xml.Name `xml:"object"`

	UnderlyingField
	Position
}

type Slot struct {
	XMLName xml.Name `xml:"obj"`

	UnderlyingField
	Position

	Number int `xml:"slot,attr"`
}

type GlobalObject struct {
	XMLName xml.Name `xml:"global_obj"`

	UnderlyingField

	SlotDistance float64 `xml:"slot_distance,attr"`
	SlotAngle    float64 `xml:"slot_angle,attr"`
}

type Parameter struct {
	XMLName xml.Name `xml:"param"`

	Key   string `xml:"key,attr"`
	Value any    `xml:"val,attr"`
}

func (p *Parameter) MarshalXML(e *xml.Encoder, start xml.StartElement) error {
	type Alias Parameter

	param := &struct {
		*Alias

		Value string `xml:"val,attr"`
	}{
		Alias: (*Alias)(p),
	}

	switch v := p.Value.(type) {
	case float64:
		param.Value = strconv.FormatFloat(math.Round(v*10000)/10000, 'f', -1, 64)

	case int:
		param.Value = strconv.Itoa(v)

	case string:
		param.Value = v

	case bool:
		c := 0
		if v {
			c = 1
		}

		param.Value = strconv.Itoa(c)

	default:
		return fmt.Errorf("unsupported parameter value type: %T", v)
	}

	return e.EncodeElement(param, start)
}

func (p *Parameter) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	type Alias Parameter

	param := &struct {
		*Alias

		Value string `xml:"val,attr"`
	}{
		Alias: (*Alias)(p),
	}

	if err := d.DecodeElement(&param, &start); err != nil {
		return err
	}

	if v, err := strconv.ParseFloat(param.Value, 64); err == nil {
		p.Value = v
	} else {
		p.Value = param.Value
	}

	return nil
}

type Event struct {
	EventID    EventListener `xml:"eventIndex,attr"`
	Parameters []*Parameter  `xml:"param"`
	Events     []*EventBody  `xml:"event"`
}

type EventBody struct {
	EventID    EventAction  `xml:"eventIndex,attr"`
	Parameters []*Parameter `xml:"param"`
}

func ToXMLString(v any) (string, error) {
	buf, err := xml.Marshal(v)
	if err != nil {
		return "", err
	}

	return string(buf), nil
}

const CannonMaxSlots = 32

const MaxEventFrames = 99999

func NewObject(x int, y int, t Block, params []*Parameter, name *string, sa *int) *Object {
	return &Object{
		UnderlyingField: UnderlyingField{
			Type:          t,
			Parameters:    params,
			Event:         make([]*Event, 0),
			Slots:         make([]*Slot, 0, CannonMaxSlots),
			GlobalObjects: make([]*GlobalObject, 0),
			SpriteAngle:   sa,
			Name:          name,
		},
		Position: Position{
			x,
			y,
		},
	}
}

func ParametersByMap(m map[string]any) []*Parameter {
	params := make([]*Parameter, 0, len(m))

	for k, v := range m {
		params = append(params, &Parameter{
			Key:   k,
			Value: v,
		})
	}

	return params
}

func FindParameter(params []*Parameter, k string) (param *Parameter, ok bool) {
	for _, param := range params {
		if param.Key == k {
			return param, true
		}
	}

	return nil, false
}

func FindAndSetParameter(params []*Parameter, k string, v any) bool {
	for _, param := range params {
		if param.Key == k {
			param.Value = v

			return true
		}
	}

	return false
}

func NewSlot(o *Object) *Slot {
	slot := &Slot{
		Position: o.Position,
	}

	slot.Type = o.Type
	slot.Parameters = slices.Clone(o.Parameters)
	slot.Event = slices.Clone(o.Event)
	slot.Slots = slices.Clone(o.Slots)
	slot.GlobalObjects = slices.Clone(o.GlobalObjects)
	slot.SpriteAngle = o.SpriteAngle
	slot.Name = o.Name

	return slot
}

func NewGlobalObject(o *Object) *GlobalObject {
	globalObject := new(GlobalObject)

	globalObject.Type = o.Type
	globalObject.Parameters = slices.Clone(o.Parameters)
	globalObject.Event = slices.Clone(o.Event)
	globalObject.Slots = slices.Clone(o.Slots)
	globalObject.GlobalObjects = slices.Clone(o.GlobalObjects)
	globalObject.SpriteAngle = o.SpriteAngle
	globalObject.Name = o.Name

	return globalObject
}
